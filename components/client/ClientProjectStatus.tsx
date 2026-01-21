import {
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Project, Task, User as UserType, WorkLogEntry } from "../../types";
import { STATUS_LABELS, STATUS_SEQUENCE } from "./clientStatusData";

interface ClientProjectStatusProps {
  currentUser: UserType;
  projects: Project[];
  users: UserType[];
  workLogs: WorkLogEntry[];
  tasks: Task[];
}

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "TBD";

export function ClientProjectStatus({
  currentUser,
  projects,
  users,
  workLogs,
  tasks,
}: ClientProjectStatusProps) {
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
  const projectWorkLogs = workLogs.filter(
    (log) => log.projectId === clientProject.id,
  );
  const recentUpdates = [...projectWorkLogs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const pendingTasks = projectTasks.filter((task) => task.status !== "completed");
  const sortByDueDate = (a: Task, b: Task) => {
    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_VALUE;
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_VALUE;
    return aDate - bDate;
  };
  const milestonePreviewLimit = 4;
  const sortedPendingTasks = [...pendingTasks].sort(sortByDueDate);
  const milestoneTasks = sortedPendingTasks.slice(0, milestonePreviewLimit);
  const remainingMilestonesCount = Math.max(
    0,
    sortedPendingTasks.length - milestoneTasks.length,
  );
  const completedTaskCount = Math.max(
    0,
    projectTasks.length - pendingTasks.length,
  );
  const totalHoursLogged = projectWorkLogs.reduce(
    (sum, log) => sum + log.hoursWorked,
    0,
  );
  const nextDeadline = pendingTasks
    .filter(Boolean)
    .sort(sortByDueDate)[0];

  const supervisor = users.find((user) => user.id === clientProject.supervisorId);
  const statusIndex = STATUS_SEQUENCE.indexOf(clientProject.status);
  const statusPercent = Math.max(0, Math.min(100, clientProject.progress));
  const isProgressing = clientProject.progress > 0 && clientProject.progress < 100;

  const timelineSteps = STATUS_SEQUENCE.map((status) => {
    const stepIndex = STATUS_SEQUENCE.indexOf(status);
    const isCompletedStep =
      statusIndex >= 0 && stepIndex <= statusIndex && status !== "in-progress";
    const isInProgressStep =
      status === "in-progress" && (isProgressing || clientProject.status === "in-progress");
    return {
      status,
      label: STATUS_LABELS[status] ?? status,
      isActive: isCompletedStep || isInProgressStep,
    };
  });

  return (
    <div className="space-y-6">
      <Card className="p-4 md:p-6">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Project Status
              </p>
              <h1 className="text-2xl font-semibold">{clientProject.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {clientProject.description || "Recent project timeline and milestones"}
              </p>
            </div>
            <Badge variant="outline" className="text-xs uppercase">
              {STATUS_LABELS[clientProject.status] ?? clientProject.status}
            </Badge>
          </div>
          <Progress value={statusPercent} className="h-2" />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(clientProject.startDate)} - {formatDate(clientProject.endDate)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Journey
            </p>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {timelineSteps.map((step) => (
                <div
                  key={step.status}
                  className={`rounded-lg border p-3 text-xs font-semibold ${
                    step.isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted-foreground/30 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span className="truncate">{step.label}</span>
                  </div>
                  <p className="text-[0.65rem] uppercase tracking-widest mt-1">
                    {step.isActive ? "Completed" : "Upcoming"}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">
                Supervisor
              </p>
              <p className="text-sm font-semibold">
                {supervisor ? supervisor.name : "Pending assignment"}
              </p>
              <p className="text-xs text-muted-foreground">
                {supervisor?.school ?? "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">
                Progress
              </p>
              <p className="text-sm font-semibold">{clientProject.progress}% Complete</p>
            </div>
            <div className="space-y-1">
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">
                Next Tasks
              </p>
              {nextDeadline ? (
                <p className="text-sm font-semibold">
                  {nextDeadline.title} — {formatDate(nextDeadline.dueDate)}
                </p>
              ) : (
                <p className="text-sm font-semibold text-muted-foreground">
                  No upcoming tasks
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4 md:p-6">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Next Tasks
            </CardTitle>
            <Badge variant="outline">{pendingTasks.length} pending</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Stay notified of upcoming approvals and meetings.
            </p>
            {milestoneTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All tasks have been completed. Great work!
              </p>
            ) : (
              milestoneTasks.map((task) => {
                const assignedCount = task.assignedTo?.length ?? 0;
                return (
                  <div
                    key={task.id}
                    className="rounded-xl border px-4 py-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{task.title}</p>
                      <Badge className="text-[0.7rem] uppercase tracking-[0.2em]">
                        {task.status.replace("-", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {task.description?.trim() || "Milestone awaiting update."}
                    </p>
                    <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">
                      <span>Due {formatDate(task.dueDate)}</span>
                      <span>
                        {assignedCount
                          ? `${assignedCount} ${assignedCount === 1 ? "assignee" : "assignees"}`
                          : "Unassigned"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            {remainingMilestonesCount > 0 && (
              <p className="text-xs text-muted-foreground">
                +{remainingMilestonesCount} more milestones pending. Check back soon for updates.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="p-4 md:p-6">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Project Report
            </CardTitle>
            <Badge variant="outline">{projectTasks.length} total</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              All reports about this project are summarized here.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border p-3 bg-muted/50 text-sm">
                <p className="text-muted-foreground uppercase tracking-[0.3em] text-[0.65rem]">
                  Completed
                </p>
                <p className="text-lg font-semibold">{completedTaskCount}</p>
              </div>
              <div className="rounded-lg border p-3 bg-muted/50 text-sm">
                <p className="text-muted-foreground uppercase tracking-[0.3em] text-[0.65rem]">
                  Pending
                </p>
                <p className="text-lg font-semibold">{pendingTasks.length}</p>
              </div>
              <div className="rounded-lg border p-3 bg-muted/50 text-sm">
                <p className="text-muted-foreground uppercase tracking-[0.3em] text-[0.65rem]">
                  Hours logged
                </p>
                <p className="text-lg font-semibold">
                  {totalHoursLogged.toFixed(1)} hrs
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Next milestone
                </p>
                {nextDeadline ? (
                  <p className="text-sm font-medium">
                    {nextDeadline.title} · {formatDate(nextDeadline.dueDate)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No upcoming milestones scheduled.
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Latest reports
                </p>
                {recentUpdates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No recent reports logged yet.
                  </p>
                ) : (
                  recentUpdates.map((log) => {
                    const fabricator = users.find(
                      (user) => user.id === log.fabricatorId,
                    );
                    return (
                      <div
                        key={log.id}
                        className="rounded-xl border p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>{formatDate(log.date)}</span>
                          <span>{log.hoursWorked.toFixed(1)} hrs</span>
                        </div>
                        <p className="text-sm font-semibold">
                          {fabricator ? fabricator.name : "Fabricator update"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.description || "No summary provided."}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
