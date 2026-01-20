import { AlertCircle, Calendar, CheckCircle, Clock, FileText, Users } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Project, Task, User as UserType, WorkLogEntry } from "../../types";
import { STATUS_LABELS } from "./clientStatusData";

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "TBD";

const getStatusVariant = (status: Project["status"]) => {
  switch (status) {
    case "completed":
      return "default";
    case "on-hold":
      return "destructive";
    case "review":
    case "pending-assignment":
      return "outline";
    case "0_Created":
      return "outline";
    default:
      return "secondary";
  }
};

const getStatusIcon = (status: Project["status"]) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4" />;
    case "on-hold":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const openLink = (url?: string) => {
  if (!url || typeof window === "undefined") return;
  window.open(url, "_blank");
};

interface ClientDashboardProps {
  currentUser: UserType;
  projects: Project[];
  users: UserType[];
  workLogs: WorkLogEntry[];
  tasks: Task[];
}

export function ClientDashboard({
  currentUser,
  projects,
  users,
  workLogs,
  tasks,
}: ClientDashboardProps) {
  const clientProject =
    projects.find((project) => project.id === currentUser.clientProjectId) ||
    projects.find((project) => project.clientId === currentUser.id);

  if (!clientProject) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-64 rounded-2xl border border-muted-foreground/40 bg-background/70 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No Project Assigned</h3>
        <p className="text-sm text-muted-foreground">
          You don't have any projects assigned to your account yet.
        </p>
      </div>
    );
  }

  const projectTasks = tasks.filter(
    (task) => task.projectId === clientProject.id
  );
  const completedTasks = projectTasks.filter(
    (task) => task.status === "completed"
  ).length;
  const taskProgress =
    projectTasks.length === 0
      ? 0
      : (completedTasks / projectTasks.length) * 100;
  const projectWorkLogs = workLogs.filter(
    (log) => log.projectId === clientProject.id
  );
  const sortedWorkLogs = [...projectWorkLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const recentWorkLogs = sortedWorkLogs.slice(0, 3);
  const supervisor = users.find(
    (user) => user.id === clientProject.supervisorId
  );
  const fabricators = users.filter((user) =>
    clientProject.fabricatorIds.includes(user.id)
  );
  const fabricatorSummaries = fabricators.map((fabricator) => {
    const logs = projectWorkLogs.filter(
      (log) => log.fabricatorId === fabricator.id
    );
    const totalHours = logs.reduce((sum, log) => sum + log.hoursWorked, 0);
    return { ...fabricator, totalHours, logsCount: logs.length };
  });
  const totalTasks = projectTasks.length;
  const pendingTasks = Math.max(totalTasks - completedTasks, 0);
  const statusLabel =
    STATUS_LABELS[clientProject.status] ?? clientProject.status;

  const navigateToProjectStatus = () => {
    if (typeof window === "undefined") return;
    window.location.hash = "project-status";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Client Dashboard
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Track the progress of your {clientProject.name} project.
          </p>
        </div>
        <Badge className="text-sm" variant="secondary">
          {currentUser.school}
        </Badge>
      </div>

      <Card className="p-4 md:p-6">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold">
              {clientProject.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {clientProject.description ||
                "Stay tuned for progress updates and documentation."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={getStatusVariant(clientProject.status)}
              className="flex items-center gap-2 text-xs uppercase tracking-wide"
            >
              {getStatusIcon(clientProject.status)}
              {statusLabel}
            </Badge>
            <Badge variant="outline" className="capitalize text-xs">
              {clientProject.priority} priority
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Project Progress</span>
              <span className="text-sm font-semibold">
                {clientProject.progress}% complete
              </span>
            </div>
            <Progress value={clientProject.progress} className="h-2" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[0.7rem] text-muted-foreground uppercase tracking-[0.3em]">
                  Start
                </p>
                <p className="text-sm font-semibold">
                  {formatDate(clientProject.startDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[0.7rem] text-muted-foreground uppercase tracking-[0.3em]">
                  Due
                </p>
                <p className="text-sm font-semibold">
                  {formatDate(clientProject.endDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-[0.7rem] text-muted-foreground uppercase tracking-[0.3em]">
                  Supervisor
                </p>
                <p className="text-sm font-semibold">
                  {supervisor ? supervisor.name : "TBD"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Badge variant="outline">
              {completedTasks} completed
            </Badge>
            <Badge variant="outline">
              {pendingTasks} pending
            </Badge>
            <Badge variant="outline">
              {fabricators.length} fabricator
              {fabricators.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={navigateToProjectStatus}>View Project Status</Button>
            {clientProject.documentationUrl && (
              <Button
                variant="outline"
                onClick={() => openLink(clientProject.documentationUrl)}
              >
                Open Documentation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4 md:p-6">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Project Documents
            </CardTitle>
            <Badge variant="outline">{clientProject.attachments?.length ?? 0} docs</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {clientProject.attachments && clientProject.attachments.length > 0 ? (
              clientProject.attachments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB - Uploaded{" "}
                      {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openLink(doc.url)}>
                    Download
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>No documentation shared yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="p-4 md:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentWorkLogs.length > 0 ? (
              recentWorkLogs.map((log) => {
                const fabricator = users.find(
                  (user) => user.id === log.fabricatorId
                );
                return (
                  <div key={log.id} className="space-y-2 rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">
                          {fabricator ? fabricator.name : "Fabricator"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.date)} -{" "}
                          {log.hoursWorked.toFixed(1)} hrs logged
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        +{log.progressPercentage}% progress
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {log.description || "No summary provided."}
                    </p>
                    {log.materials && log.materials.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Materials: {log.materials.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>No activity logged yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4 md:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Fabrication Team
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">
                Supervisor
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {supervisor ? supervisor.name : "Not assigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {supervisor?.school ?? "N/A"} - {supervisor?.secureId ?? "-"}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">
                Fabricators
              </p>
              {fabricatorSummaries.length > 0 ? (
                <div className="space-y-3 mt-3">
                  {fabricatorSummaries.map((fabricator) => (
                    <div
                      key={fabricator.id}
                      className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{fabricator.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {fabricator.school} - {fabricator.secureId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {fabricator.totalHours.toFixed(1)} hrs
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fabricator.logsCount} updates
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-3">
                  No fabricators assigned yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
