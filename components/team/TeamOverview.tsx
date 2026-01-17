import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Briefcase,
  Calendar,
  ClipboardList,
  Crown,
  FolderKanban,
  Mail,
  Phone,
  Search,
  Shield,
  UserPlus,
  User as UserIcon,
  Users,
  Wrench,
} from "lucide-react";
import { Project, Task, User, WorkLogEntry } from "../../types";

interface TeamOverviewProps {
  users: User[];
  projects: Project[];
  tasks: Task[];
  workLogs: WorkLogEntry[];
  currentUser: User;
  onAssignFabricator?: (
    projectId: string,
    fabricatorId: string,
    message?: string
  ) => void;
}

type TeamMember = {
  user: User;
  assignedProjects: Project[];
  pendingProjects: Project[];
  acceptedProjects: Project[];
  assignedTasks: Task[];
  totalHours: number;
  lastActivity: Date | null;
};

const getInitials = (name: string) => {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "NA";
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
};

const getRoleBadgeVariant = (role: User["role"]) => {
  switch (role) {
    case "admin":
      return "destructive";
    case "supervisor":
      return "default";
    case "fabricator":
      return "secondary";
    default:
      return "outline";
  }
};

const getRoleIcon = (role: User["role"]) => {
  switch (role) {
    case "admin":
      return <Crown className="h-3.5 w-3.5" />;
    case "supervisor":
      return <Shield className="h-3.5 w-3.5" />;
    case "fabricator":
      return <Wrench className="h-3.5 w-3.5" />;
    default:
      return <UserIcon className="h-3.5 w-3.5" />;
  }
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "No activity";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity";
  return date.toLocaleDateString();
};

export function TeamOverview({
  users,
  projects,
  tasks,
  workLogs,
  currentUser,
  onAssignFabricator,
}: TeamOverviewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedFabricatorId, setSelectedFabricatorId] = useState("");

  const scopedProjects = useMemo(() => {
    if (currentUser.role === "admin") return projects;
    if (currentUser.role === "supervisor") {
      return projects.filter((project) => project.supervisorId === currentUser.id);
    }
    if (currentUser.role === "fabricator") {
      return projects.filter((project) =>
        project.fabricatorIds.includes(currentUser.id) ||
        project.pendingAssignments?.some(
          (assignment) =>
            assignment.fabricatorId === currentUser.id &&
            assignment.status === "pending"
        )
      );
    }
    if (currentUser.role === "client" && currentUser.clientProjectId) {
      return projects.filter(
        (project) => project.id === currentUser.clientProjectId
      );
    }
    return [];
  }, [currentUser, projects]);

  const scopedProjectIds = useMemo(
    () => new Set(scopedProjects.map((project) => project.id)),
    [scopedProjects]
  );

  const scopedTasks = useMemo(
    () => tasks.filter((task) => scopedProjectIds.has(task.projectId)),
    [tasks, scopedProjectIds]
  );

  const scopedWorkLogs = useMemo(
    () => workLogs.filter((log) => scopedProjectIds.has(log.projectId)),
    [workLogs, scopedProjectIds]
  );

  const scopedUsers = useMemo(() => {
    const ensureCurrentUser = (list: User[]) => {
      if (list.some((user) => user.id === currentUser.id)) return list;
      return [...list, currentUser];
    };

    if (currentUser.role === "admin") return users;
    if (currentUser.role === "supervisor") {
      const teamIds = new Set<string>([currentUser.id]);
      scopedProjects.forEach((project) => {
        project.fabricatorIds.forEach((id) => teamIds.add(id));
        project.pendingAssignments?.forEach((assignment) => {
          if (assignment.status === "pending") {
            teamIds.add(assignment.fabricatorId);
          }
        });
      });
      users.forEach((user) => {
        if (
          user.role === "client" &&
          user.clientProjectId &&
          scopedProjectIds.has(user.clientProjectId)
        ) {
          teamIds.add(user.id);
        }
      });
      return ensureCurrentUser(users.filter((user) => teamIds.has(user.id)));
    }
    if (currentUser.role === "fabricator") {
      const teamIds = new Set<string>([currentUser.id]);
      scopedProjects.forEach((project) => {
        if (project.supervisorId) {
          teamIds.add(project.supervisorId);
        }
        project.fabricatorIds.forEach((id) => teamIds.add(id));
      });
      return ensureCurrentUser(users.filter((user) => teamIds.has(user.id)));
    }
    return ensureCurrentUser(users.filter((user) => user.id === currentUser.id));
  }, [currentUser, scopedProjectIds, scopedProjects, users]);

  const teamMembers = useMemo<TeamMember[]>(() => {
    return scopedUsers.map((user) => {
      let assignedProjects: Project[] = [];
      let pendingProjects: Project[] = [];
      let acceptedProjects: Project[] = [];
      if (user.role === "supervisor") {
        assignedProjects = scopedProjects.filter(
          (project) => project.supervisorId === user.id
        );
        acceptedProjects = assignedProjects;
      } else if (user.role === "fabricator") {
        acceptedProjects = scopedProjects.filter((project) =>
          project.fabricatorIds.includes(user.id)
        );
        pendingProjects = scopedProjects.filter((project) =>
          project.pendingAssignments?.some(
            (assignment) =>
              assignment.fabricatorId === user.id &&
              assignment.status === "pending"
          )
        );
        const combined = new Map<string, Project>();
        [...acceptedProjects, ...pendingProjects].forEach((project) => {
          combined.set(project.id, project);
        });
        assignedProjects = Array.from(combined.values());
      } else if (user.role === "client" && user.clientProjectId) {
        assignedProjects = scopedProjects.filter(
          (project) => project.id === user.clientProjectId
        );
        acceptedProjects = assignedProjects;
      }

      const assignedTasks = scopedTasks.filter(
        (task) => task.assignedTo === user.id
      );
      const userLogs = scopedWorkLogs.filter(
        (log) => log.fabricatorId === user.id
      );
      const totalHours = userLogs.reduce(
        (sum, log) => sum + (log.hoursWorked || 0),
        0
      );

      const activityTimes = [
        ...assignedTasks.map((task) => task.updatedAt || task.createdAt),
        ...userLogs.map((log) => log.date),
      ]
        .map((value) => new Date(value).getTime())
        .filter((value) => !Number.isNaN(value));

      const lastActivity = activityTimes.length
        ? new Date(Math.max(...activityTimes))
        : null;

      return {
        user,
        assignedProjects,
        pendingProjects,
        acceptedProjects,
        assignedTasks,
        totalHours,
        lastActivity,
      };
    });
  }, [scopedProjects, scopedTasks, scopedUsers, scopedWorkLogs]);

  const getAvailableFabricators = (projectId: string) => {
    const project = scopedProjects.find((item) => item.id === projectId);
    if (!project) return [];

    return users.filter(
      (user) =>
        user.role === "fabricator" &&
        !project.fabricatorIds.includes(user.id) &&
        !project.pendingAssignments?.some(
          (assignment) =>
            assignment.fabricatorId === user.id && assignment.status === "pending"
        )
    );
  };

  const handleAssignFabricator = () => {
    if (!onAssignFabricator) return;
    if (!selectedProjectId || !selectedFabricatorId) return;
    onAssignFabricator(selectedProjectId, selectedFabricatorId);
    setShowAssignDialog(false);
    setSelectedProjectId("");
    setSelectedFabricatorId("");
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredMembers = useMemo(() => {
    let result = teamMembers;

    if (roleFilter !== "all") {
      result = result.filter((member) => member.user.role === roleFilter);
    }

    if (projectFilter !== "all") {
      result = result.filter((member) =>
        member.assignedProjects.some((project) => project.id === projectFilter)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((member) => {
        const isAssigned = member.assignedProjects.length > 0;
        return statusFilter === "assigned" ? isAssigned : !isAssigned;
      });
    }

    if (normalizedSearch) {
      result = result.filter((member) => {
        const haystack = [
          member.user.name,
          member.user.email,
          member.user.role,
          member.user.school,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    }

    return result;
  }, [normalizedSearch, projectFilter, roleFilter, statusFilter, teamMembers]);

  const sortedMembers = useMemo(() => {
    const next = [...filteredMembers];
    next.sort((a, b) => {
      switch (sortBy) {
        case "name-desc":
          return b.user.name.localeCompare(a.user.name);
        case "projects-desc":
          return b.assignedProjects.length - a.assignedProjects.length;
        case "tasks-desc":
          return b.assignedTasks.length - a.assignedTasks.length;
        case "activity-desc": {
          const aTime = a.lastActivity ? a.lastActivity.getTime() : 0;
          const bTime = b.lastActivity ? b.lastActivity.getTime() : 0;
          return bTime - aTime;
        }
        default:
          return a.user.name.localeCompare(b.user.name);
      }
    });
    return next;
  }, [filteredMembers, sortBy]);

  const totalMembers = scopedUsers.length;
  const totalProjects = scopedProjects.length;
  const openTasks = scopedTasks.filter((task) => task.status !== "completed").length;
  const totalFabricators = scopedUsers.filter(
    (user) => user.role === "fabricator"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-700" />
            Team
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track people, assignments, and workload across your projects.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => setShowAssignDialog(true)}
          disabled={!onAssignFabricator || scopedProjects.length === 0}
        >
          <UserPlus className="h-4 w-4" />
          Add members
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-col items-center gap-2 pb-2 text-center">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-sm">Team Members</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-semibold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              Visible in your scope
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col items-center gap-2 pb-2 text-center">
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-sm">Active Projects</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-semibold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Projects in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col items-center gap-2 pb-2 text-center">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-sm">Open Tasks</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-semibold">{openTasks}</div>
            <p className="text-xs text-muted-foreground">Pending or active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col items-center gap-2 pb-2 text-center">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-sm">Fabricators</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-semibold">{totalFabricators}</div>
            <p className="text-xs text-muted-foreground">Available talent</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-4 px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Team Directory
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Filter and sort team members to find the right people fast.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Label htmlFor="team-search" className="sr-only">
                  Search team
                </Label>
                <Input
                  id="team-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search team"
                  className="pl-9"
                />
              </div>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {scopedProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="projects-desc">Projects (high)</SelectItem>
                  <SelectItem value="tasks-desc">Tasks (high)</SelectItem>
                  <SelectItem value="activity-desc">Recent activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {sortedMembers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No team members match the current filters.
            </div>
          ) : (
            <>
              <div className="space-y-4 md:hidden">
                {sortedMembers.map((member) => (
                  <Card key={member.user.id} className="border-muted">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {getInitials(member.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">
                              {member.user.name}
                            </div>
                            <Badge
                              variant={getRoleBadgeVariant(member.user.role)}
                              className="capitalize"
                            >
                              {getRoleIcon(member.user.role)}
                              {member.user.role}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedMember(member)}
                        >
                          View
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Projects</div>
                        <div className="text-right">
                          {member.assignedProjects.length}
                        </div>
                        <div className="text-muted-foreground">Tasks</div>
                        <div className="text-right">
                          {member.assignedTasks.length}
                        </div>
                        <div className="text-muted-foreground">Hours</div>
                        <div className="text-right">
                          {member.user.role === "fabricator"
                            ? member.totalHours.toLocaleString()
                            : "-"}
                        </div>
                        <div className="text-muted-foreground">Activity</div>
                        <div className="text-right">
                          {formatDate(member.lastActivity)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[220px] text-white">
                        Member
                      </TableHead>
                      <TableHead className="text-white">Role</TableHead>
                      <TableHead className="text-center text-white">
                        Projects
                      </TableHead>
                      <TableHead className="text-center text-white">
                        Tasks
                      </TableHead>
                      <TableHead className="text-center text-white">
                        Hours
                      </TableHead>
                      <TableHead className="text-white">Last Activity</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-right text-white">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMembers.map((member) => {
                      const hasAccepted = member.acceptedProjects.length > 0;
                      const hasPending = member.pendingProjects.length > 0;
                      const statusLabel = hasAccepted
                        ? "Assigned"
                        : hasPending
                        ? "Pending"
                        : "Unassigned";
                      const statusVariant = hasAccepted
                        ? "default"
                        : hasPending
                        ? "secondary"
                        : "outline";

                      return (
                        <TableRow key={member.user.id} className="hover:bg-muted/40">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback>
                                  {getInitials(member.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {member.user.name}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3.5 w-3.5" />
                                  {member.user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getRoleBadgeVariant(member.user.role)}
                              className="capitalize"
                            >
                              {getRoleIcon(member.user.role)}
                              {member.user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {member.assignedProjects.length}
                          </TableCell>
                          <TableCell className="text-center">
                            {member.assignedTasks.length}
                          </TableCell>
                          <TableCell className="text-center">
                            {member.user.role === "fabricator"
                              ? member.totalHours.toLocaleString()
                              : "-"}
                          </TableCell>
                          <TableCell>{formatDate(member.lastActivity)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant}>{statusLabel}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMember(member)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedMember)}
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          {selectedMember && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(selectedMember.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedMember.user.name}</span>
                </DialogTitle>
                <DialogDescription>
                  {selectedMember.user.role.charAt(0).toUpperCase() +
                    selectedMember.user.role.slice(1)}{" "}
                  profile and assignments
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      Contact Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedMember.user.email}</span>
                    </div>
                    {selectedMember.user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedMember.user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedMember.user.school || "Not set"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Activity Snapshot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Projects</span>
                      <span>{selectedMember.assignedProjects.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tasks</span>
                      <span>{selectedMember.assignedTasks.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Hours</span>
                      <span>
                        {selectedMember.user.role === "fabricator"
                          ? selectedMember.totalHours.toLocaleString()
                          : "-"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last active</span>
                      <span>{formatDate(selectedMember.lastActivity)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-muted">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    Assigned Projects
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedMember.assignedProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No assigned projects.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.assignedProjects.map((project) => {
                        const isPending = selectedMember.pendingProjects.some(
                          (pending) => pending.id === project.id
                        );
                        return (
                          <Badge
                            key={project.id}
                            variant={isPending ? "secondary" : "outline"}
                          >
                            {project.name}
                            {isPending ? " (Pending)" : ""}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

            </>
          )}
        </DialogContent>
      </Dialog>

        <Dialog
          open={showAssignDialog}
          onOpenChange={(open) => {
            setShowAssignDialog(open);
            if (!open) {
              setSelectedProjectId("");
              setSelectedFabricatorId("");
            }
          }}
        >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Fabricator to Project</DialogTitle>
            <DialogDescription>
              Pick a project and assign a fabricator to join the team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-project">Project</Label>
              <Select
                value={selectedProjectId}
                onValueChange={(value) => {
                  setSelectedProjectId(value);
                  setSelectedFabricatorId("");
                }}
              >
                <SelectTrigger id="team-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {scopedProjects.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No projects available
                    </SelectItem>
                  ) : (
                    scopedProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-fabricator">Fabricator</Label>
              <Select
                value={selectedFabricatorId}
                onValueChange={setSelectedFabricatorId}
                disabled={!selectedProjectId}
              >
                <SelectTrigger id="team-fabricator">
                  <SelectValue placeholder="Select fabricator" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProjectId &&
                  getAvailableFabricators(selectedProjectId).length > 0 ? (
                    getAvailableFabricators(selectedProjectId).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.secureId})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No available fabricators
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignFabricator}
                disabled={!selectedProjectId || !selectedFabricatorId}
              >
                <UserPlus className="h-4 w-4" />
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
