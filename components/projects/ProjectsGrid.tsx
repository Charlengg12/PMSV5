import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Calendar,
  PhilippinePeso,
  Users,
  Building,
  FileText,
  Link,
  Paperclip,
  Plus,
  UserPlus,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  TrendingUp,
  AlertCircle,
  FolderOpen,
  MessageCircle,
  Search,
} from "lucide-react";
import { Project, ProjectFeedback, User } from "../../types";
import { CreateProjectForm } from "./CreateProjectForm";
import { ProjectDetails } from "./ProjectDetails";
import { emailService } from "../../utils/emailService";
import { ClientCreationDialog } from "../client/ClientCreationDialog";

interface ProjectsGridProps {
  projects: Project[];
  users: User[];
  currentUser: User;
  onCreateProject?: (
    project: Omit<Project, "id">
  ) => void | Promise<void> | Promise<Project>;
  onAssignFabricator?: (
    projectId: string,
    fabricatorId: string,
    message?: string
  ) => void;
  onUpdateProject?: (project: Project) => void;
  onAcceptAssignment?: (
    assignmentId: string,
    response?: string,
    projectId?: string
  ) => void;
  onDeclineAssignment?: (
    assignmentId: string,
    response?: string,
    projectId?: string
  ) => void;
  onCreateUser?: (user: User) => void;
  onBroadcastFabricators?: (projectId: string, message?: string) => void;
}

export function ProjectsGrid({
  projects = [],
  users = [],
  currentUser,
  onCreateProject,
  onAssignFabricator,
  onUpdateProject,
  onAcceptAssignment,
  onDeclineAssignment,
  onCreateUser,
  onBroadcastFabricators,
}: ProjectsGridProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [clientDialogProject, setClientDialogProject] = useState<Project | null>(
    null
  );
  const [localClientAssignedProjectIds, setLocalClientAssignedProjectIds] =
    useState<Set<string>>(new Set());
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(
    null
  );

  // ─── Search state ───────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");

  if (!currentUser) return null;

  // Role-based initial filtering
  const getRoleFilteredProjects = () => {
    if (currentUser.role === "admin") {
      return projects;
    }
    if (currentUser.role === "supervisor") {
      return projects.filter(
        (p) =>
          p.supervisorId === currentUser.id ||
          (p.pendingSupervisors &&
            p.pendingSupervisors.includes(currentUser.id))
      );
    }
    if (currentUser.role === "fabricator") {
      return projects.filter(
        (p) =>
          p.fabricatorIds.includes(currentUser.id) ||
          p.pendingAssignments?.some(
            (assignment) =>
              assignment.fabricatorId === currentUser.id &&
              assignment.status === "pending"
          )
      );
    }
    return projects.filter((p) => p.fabricatorIds.includes(currentUser.id));
  };

  const roleFilteredProjects = getRoleFilteredProjects();

  // Client-side search filtering
  const filteredProjects = roleFilteredProjects
    .filter((p) => p.status !== "completed" && p.progress < 100)
    .filter((project) => {
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase().trim();

      const supervisorName =
        users
          .find((u) => u.id === project.supervisorId)
          ?.name?.toLowerCase() || "";

      const fabricatorNames = project.fabricatorIds
        .map((id) => users.find((u) => u.id === id)?.name?.toLowerCase() || "")
        .join(" ");

      return (
        project.name.toLowerCase().includes(term) ||
        (project.description || "").toLowerCase().includes(term) ||
        (project.clientName || "").toLowerCase().includes(term) ||
        supervisorName.includes(term) ||
        fabricatorNames.includes(term)
      );
    });

  const canCreateProject =
    currentUser.role === "admin" || currentUser.role === "supervisor";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "0_Created":
        return "outline";
      case "1_Assigned_to_FAB":
        return "secondary";
      case "pending-assignment": // ADDED THIS for broadcast status
        return "destructive";
      case "in-progress": // ADDED THIS for accepted status
        return "default";
      case "2_Ready_for_Supervisor_Review":
        return "destructive";
      case "3_Ready_for_Admin_Review":
        return "destructive";
      case "4_Ready_for_Client_Signoff":
        return "default";
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const getSupervisorLabel = (project: Project) => {
    if (project.supervisorId) {
      const supervisor = users.find((u) => u.id === project.supervisorId);
      return supervisor?.name || "Unknown Supervisor";
    }

    if (project.pendingSupervisors && project.pendingSupervisors.length > 0) {
      return "Pending supervisor acceptance";
    }

    return "Not assigned";
  };

  const getFabricatorNames = (fabricatorIds: string[]) => {
    return fabricatorIds
      .map((id) => users.find((u) => u.id === id)?.name || "Unknown")
      .join(", ");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatFeedbackDate = (value?: string) =>
    value
      ? new Date(value).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "TBD";

  const getFabricatorBudget = (project: Project, fabricatorId: string) => {
    return project.fabricatorBudgets?.find(
      (fb) => fb.fabricatorId === fabricatorId
    );
  };

  const supervisorProjectScope =
    currentUser.role === "supervisor"
      ? projects.filter(
          (project) =>
            project.supervisorId === currentUser.id ||
            project.pendingSupervisors?.includes(currentUser.id)
        )
      : [];

  const feedbackPool =
    currentUser.role === "admin"
      ? projects
      : currentUser.role === "supervisor"
      ? supervisorProjectScope
      : [];

  const latestFeedbackEntries: (ProjectFeedback & { projectName: string })[] =
    feedbackPool
      .flatMap((project) =>
        (project.feedbackEntries ?? []).map((entry) => ({
          ...entry,
          projectName: project.name,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 4);

  const handleCreateProject = async (project: Omit<Project, "id">) => {
    if (onCreateProject) {
      await onCreateProject(project);
    }
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    if (onUpdateProject) {
      onUpdateProject(updatedProject);
      emailService.sendProjectUpdate(
        updatedProject,
        users,
        "progress_update",
        currentUser
      );
    }
  };

  const isClientAssigned = (project: Project) => {
    if (localClientAssignedProjectIds.has(project.id)) return true;
    if (project.clientName && project.clientName.trim().length > 0) return true;
    return users.some(
      (u) => u.role === "client" && u.clientProjectId === project.id
    );
  };

  const handleTransition = (
    project: Project,
    nextStatus: Project["status"]
  ) => {
    if (!onUpdateProject) return;
    const updatedProject = { ...project, status: nextStatus };
    onUpdateProject(updatedProject);
    emailService.sendProjectUpdate(
      updatedProject,
      users,
      "status_change",
      currentUser
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl">
            <FolderOpen className="inline-block mr-2 mb-1 text-blue-700" />
            Projects
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track your projects
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            {(currentUser.role === "admin" ||
              currentUser.role === "supervisor") && (
              <div className="w-full sm:w-auto whitespace-nowrap text-sm text-green-600 flex items-center gap-1">
                Total Completed:{" "}
                {
                  projects.filter(
                    (p) => p.status === "completed" || p.progress >= 100
                  ).length
                }
              </div>
            )}

            {canCreateProject && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-accent hover:bg-accent/90 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="relative flex-1 sm:min-w-[280px]">
        <Search className="absolute left-3 top-4.5 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Search project..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full max-w-md"
        />
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-medium text-[#e28a33]">Note:</span> You can
          search by name, client, or supervisor
        </p>
      </div>

      {(currentUser.role === "admin" ||
        currentUser.role === "supervisor") && (
        <Card className="p-4 md:p-6">
          <CardHeader className="p-0 flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5" />
              Client Feedback
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {latestFeedbackEntries.length} recent
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {latestFeedbackEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No client feedback has been recorded for your projects yet.
                </p>
              ) : (
                latestFeedbackEntries.map((entry) => (
                  <div
                    key={`${entry.id}-${entry.projectId}`}
                    className="rounded-xl border p-3 space-y-1"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {entry.comment}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
                      <span>{entry.projectName}</span>
                      <span>{formatFeedbackDate(entry.createdAt)}</span>
                    </div>
                    <p className="text-[0.65rem] font-semibold text-muted-foreground">
                      {entry.createdByName || entry.createdBy || "Client"}{" "}
                      <span className="text-[0.6rem]">
                        ({entry.createdByRole || "client"})
                      </span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="hover:shadow-lg transition-all duration-200 border-0 shadow-md overflow-hidden group"
          >
            <div className="h-2 bg-gradient-to-r from-primary to-accent"></div>
            <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent p-4 sm:p-6">
              <div className="space-y-2">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={getStatusColor(project.status)}
                    className="text-xs"
                  >
                    {project.status === "pending-assignment"
                      ? "Broadcasting"
                      : project.status === "in-progress"
                      ? "In Progress"
                      : project.status.replace(/_/g, " ")}
                  </Badge>
                  <Badge
                    variant={getPriorityColor(project.priority)}
                    className="text-xs"
                  >
                    {project.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>

              {/* Role-based financial information */}
              {currentUser.role === "fabricator" && (
                <div className="bg-secondary/20 p-2 rounded mt-2">
                  {(() => {
                    const fabricatorBudget = getFabricatorBudget(
                      project,
                      currentUser.id
                    );
                    if (fabricatorBudget) {
                      return (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">
                              My Budget:
                            </span>
                            <span className="font-medium">
                              ₱
                              {fabricatorBudget.allocatedAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">
                              Spent:
                            </span>
                            <span>
                              ₱{fabricatorBudget.spentAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="flex items-center gap-2 text-xs">
                          <PhilippinePeso className="h-3 w-3" />
                          <span>
                            Labor Pool: ₱
                            {Number(
                              project.fabricatorAllocation || 0
                            ).toLocaleString()}
                          </span>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}

              {currentUser.role === "supervisor" && (
                <div className="bg-muted/30 p-2 rounded text-xs space-y-1 mt-2 border border-border">
                  <div className="flex justify-between font-semibold border-b pb-1 mb-1">
                    <span>Total Budget:</span>
                    <span>₱{Number(project.budget).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Materials:</span>
                    <span>
                      ₱
                      {Number(
                        project.materialsAllocation || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Labor:</span>
                    <span>
                      ₱
                      {Number(
                        project.fabricatorAllocation || 0
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t mt-1">
                    <span className="text-muted-foreground">
                      Total Spent:
                    </span>
                    <span className="text-orange-600">
                      ₱{Number(project.spent).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {currentUser.role === "admin" && (
                <div className="bg-muted/30 p-2 rounded text-xs space-y-1 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Revenue:
                    </span>
                    <span className="font-medium text-green-700 dark:text-green-400">
                      ₱{Number(project.revenue).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Est. Cost:</span>
                    <span>₱{Number(project.budget).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-dashed my-1"></div>
                  <div className="flex justify-between items-center font-semibold">
                    <span>Est. Profit:</span>
                    <span
                      className={
                        Number(project.revenue) - Number(project.budget) >= 0
                          ? "text-green-600"
                          : "text-destructive"
                      }
                    >
                      ₱
                      {(
                        Number(project.revenue) - Number(project.budget)
                      ).toLocaleString()}
                    </span>
                  </div>
                  {Number(project.spent) > Number(project.budget) && (
                    <div className="flex items-center gap-1 text-destructive mt-1 justify-end">
                      <AlertCircle className="h-3 w-3" />
                      <span>Over Budget</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building className="h-3 w-3" />
                <span className="truncate">
                  Client: {project.clientName || "Not assigned"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(project.startDate).toLocaleDateString()} -{" "}
                  {new Date(project.endDate).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span className="truncate">
                  Supervisor: {getSupervisorLabel(project)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span className="truncate">
                  Team: {getFabricatorNames(project.fabricatorIds) || "None"}
                </span>
              </div>

              {project.documentationUrl && (
                <div className="flex items-center gap-2 text-xs">
                  <Link className="h-3 w-3" />
                  <a
                    href={project.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    Google Drive Documentation
                  </a>
                </div>
              )}

              {project.attachments && project.attachments.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <Paperclip className="h-3 w-3" />
                    <span>Attachments ({project.attachments.length})</span>
                  </div>
                  <div className="ml-5 space-y-1">
                    {project.attachments.slice(0, 2).map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-1 text-xs"
                      >
                        <FileText className="h-3 w-3" />
                        <span className="truncate">{attachment.name}</span>
                        <span className="text-muted-foreground">
                          ({formatFileSize(attachment.size)})
                        </span>
                      </div>
                    ))}
                    {project.attachments.length > 2 && (
                      <div className="text-xs text-muted-foreground ml-4">
                        +{project.attachments.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>
                  Created by:{" "}
                  {users.find((u) => u.id === project.createdBy)?.name ||
                    "Unknown"}
                </span>
              </div>

              {/* Pending Supervisor Assignment Banner */}
              {currentUser.role === "supervisor" &&
                project.pendingSupervisors?.includes(currentUser.id) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-semibold text-blue-900 dark:text-blue-100">
                        Pending Project Assignment
                      </span>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      You have been invited to supervise this project.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() =>
                          onAcceptAssignment &&
                          onAcceptAssignment("", "accepted", project.id)
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() =>
                          onDeclineAssignment &&
                          onDeclineAssignment("", "declined", project.id)
                        }
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                )}

              {/* ─── PENDING ASSIGNMENT BANNER FOR FABRICATORS ─── */}
              {currentUser.role === "fabricator" &&
                project.pendingAssignments?.some(
                  (assignment) =>
                    assignment.fabricatorId === currentUser.id &&
                    assignment.status === "pending"
                ) &&
                !project.fabricatorIds.includes(currentUser.id) && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-lg p-4 space-y-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      <span className="font-semibold text-orange-900 dark:text-orange-100">
                        New Project Assignment
                      </span>
                    </div>
                    {project.pendingAssignments
                      .filter(
                        (a) =>
                          a.fabricatorId === currentUser.id &&
                          a.status === "pending"
                      )
                      .map((assignment) => {
                        const supervisor = users.find(
                          (u) => u.id === assignment.assignedBy
                        );
                        const isAcceptMode =
                          selectedAssignment === `accept-${assignment.id}`;
                        const isDeclineMode =
                          selectedAssignment === assignment.id &&
                          !selectedAssignment?.includes("accept-");

                        return (
                          <div key={assignment.id} className="space-y-3">
                            <div className="text-xs text-orange-700 dark:text-orange-300 flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              <span>
                                Assigned by:{" "}
                                <strong>
                                  {supervisor?.name || "Unknown Supervisor"}
                                </strong>
                              </span>
                            </div>

                            {/* Default Buttons */}
                            {!isAcceptMode && !isDeclineMode && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => {
                                    setSelectedAssignment(
                                      `accept-${assignment.id}`
                                    );
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400"
                                  onClick={() => {
                                    setSelectedAssignment(assignment.id);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Decline
                                </Button>
                              </div>
                            )}

                            {/* Accept Confirmation */}
                            {isAcceptMode && (
                              <div className="space-y-3 bg-green-50 dark:bg-green-900/10 rounded-md p-3 border border-green-200 dark:border-green-800">
                                <Label className="text-sm font-medium text-green-900 dark:text-green-100">
                                  Confirm Accept
                                </Label>
                                <p className="text-sm text-green-800 dark:text-green-200">
                                  Are you sure you want to take this project?
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setSelectedAssignment(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => {
                                      if (onAcceptAssignment) {
                                        onAcceptAssignment(
                                          assignment.id,
                                          "accepted",
                                          project.id
                                        );
                                        setSelectedAssignment(null);
                                      }
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Confirm
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Decline Confirmation */}
                            {isDeclineMode && (
                              <div className="space-y-3 bg-red-50 dark:bg-red-900/10 rounded-md p-3 border border-red-200 dark:border-red-800">
                                <Label className="text-sm font-medium text-red-900 dark:text-red-100">
                                  Confirm Decline
                                </Label>
                                <p className="text-sm text-red-800 dark:text-red-200">
                                  Are you sure you want to decline?
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 dark:text-white"
                                    onClick={() => setSelectedAssignment(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1 dark:text-white"
                                    onClick={() => {
                                      if (onDeclineAssignment) {
                                        onDeclineAssignment(
                                          assignment.id,
                                          "declined",
                                          project.id
                                        );
                                        setSelectedAssignment(null);
                                      }
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Decline
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleViewDetails(project)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  <span className="truncate">Details</span>
                </Button>

                {(currentUser.role === "admin" ||
                  currentUser.role === "supervisor") &&
                  (isClientAssigned(project) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="w-full"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Client
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-primary"
                      onClick={() => {
                        setClientDialogProject(project);
                        setShowClientDialog(true);
                      }}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Client
                    </Button>
                  ))}

                {/* BROADCAST BUTTON FOR SUPERVISOR */}
                {currentUser.role === "supervisor" &&
                  project.supervisorId === currentUser.id && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() =>
                        onBroadcastFabricators &&
                        onBroadcastFabricators(project.id)
                      }
                      disabled={
                        project.status === "pending-assignment" ||
                        project.status === "completed"
                      }
                    >
                      <Users className="h-3 w-3 mr-1" />
                      <span className="truncate">
                        {project.status === "pending-assignment"
                          ? "Broadcasting..."
                          : "Broadcast FABs"}
                      </span>
                    </Button>
                  )}

                {currentUser.role === "admin" &&
                  project.status === "0_Created" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full sm:col-span-2 bg-primary"
                      onClick={() =>
                        handleTransition(project, "1_Assigned_to_FAB")
                      }
                    >
                      Assign Now
                    </Button>
                  )}

                {currentUser.role === "fabricator" &&
                  (project.status === "1_Assigned_to_FAB" ||
                    project.status === "in-progress") && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full sm:col-span-2 bg-primary"
                      onClick={() =>
                        handleTransition(
                          project,
                          "2_Ready_for_Supervisor_Review"
                        )
                      }
                      disabled={
                        !(
                          project.documentationUrl ||
                          (project.attachments &&
                            project.attachments.length > 0)
                        )
                      }
                    >
                      Submit Review
                    </Button>
                  )}

                {currentUser.role === "supervisor" &&
                  project.status === "2_Ready_for_Supervisor_Review" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          handleTransition(project, "3_Ready_for_Admin_Review")
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/20"
                        onClick={() =>
                          handleTransition(project, "1_Assigned_to_FAB")
                        }
                      >
                        Reject
                      </Button>
                    </>
                  )}

                {currentUser.role === "admin" &&
                  project.status === "3_Ready_for_Admin_Review" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full sm:col-span-2 bg-green-600 hover:bg-green-700"
                      onClick={() =>
                        handleTransition(
                          project,
                          "4_Ready_for_Client_Signoff"
                        )
                      }
                    >
                      Final Approval
                    </Button>
                  )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg mb-2">No projects found</h3>
            <p className="text-muted-foreground">
              {currentUser.role === "fabricator"
                ? "You have no active or pending projects."
                : "Try adjusting your search terms or create a new project."}
            </p>
          </CardContent>
        </Card>
      )}

      {showCreateForm && (
        <CreateProjectForm
          currentUser={currentUser}
          users={users}
          onCreateProject={async (project) => {
            await handleCreateProject(project);
          }}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {showProjectDetails && selectedProject && (
        <ProjectDetails
          project={selectedProject}
          users={users}
          currentUser={currentUser}
          onUpdateProject={handleUpdateProject}
          onClose={() => setShowProjectDetails(false)}
        />
      )}

      {showClientDialog && clientDialogProject && (
        <ClientCreationDialog
          open={showClientDialog}
          onClose={() => {
            setShowClientDialog(false);
            setClientDialogProject(null);
          }}
          project={clientDialogProject}
          onClientCreated={(client) => {
            onCreateUser?.(client);
            onUpdateProject?.({
              ...clientDialogProject,
              clientId: client.id,
              clientName: client.name,
            });
            setLocalClientAssignedProjectIds((prev) =>
              new Set([...prev, clientDialogProject.id])
            );
            setShowClientDialog(false);
            setClientDialogProject(null);
          }}
        />
      )}
    </div>
  );
}
