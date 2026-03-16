import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CheckCircle, Clock3, AlertCircle, ListTodo } from "lucide-react";
import { Task, User, Project } from "../../types";

interface TaskListProps {
  tasks: Task[];
  projects: Project[];
  currentUser: User;
  onUpdateTaskStatus?: (taskId: string, status: Task["status"]) => void;
}

export function TaskList({
  tasks,
  projects,
  currentUser,
  onUpdateTaskStatus,
}: TaskListProps) {
  const [displayTasks, setDisplayTasks] = useState<Task[]>(tasks);

  useEffect(() => {
    setDisplayTasks(tasks);
  }, [tasks]);

  const getFilteredTasks = () => {
    if (currentUser.role === "admin") {
      return displayTasks;
    }
    if (currentUser.role === "supervisor") {
      const supervisorProjects = projects.filter(
        (project) => project.supervisorId === currentUser.id,
      );
      return displayTasks.filter((task) =>
        supervisorProjects.some((project) => project.id === task.projectId),
      );
    }
    return displayTasks.filter((task) => task.assignedTo === currentUser.id);
  };

  const filteredTasks = getFilteredTasks().slice(0, 8);

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "in-progress":
        return <Clock3 className="h-4 w-4 text-blue-500" />;
      case "blocked":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "pending":
      default:
        return <Clock3 className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "blocked":
        return "destructive";
      case "pending":
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
      default:
        return "outline";
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((entry) => entry.id === projectId);
    return project?.name || "Unknown Project";
  };

  const canUpdateTask = (task: Task) => {
    return currentUser.role === "fabricator" && task.assignedTo === currentUser.id;
  };

  const canMarkAsDone = (task: Task) => {
    return (
      (currentUser.role === "admin" || currentUser.role === "supervisor") &&
      task.status !== "completed"
    );
  };

  const getNextStatus = (currentStatus: Task["status"]): Task["status"] => {
    switch (currentStatus) {
      case "pending":
        return "in-progress";
      case "in-progress":
      case "blocked":
      case "completed":
      default:
        return "completed";
    }
  };

  const handleStatusUpdate = (taskId: string, status: Task["status"]) => {
    setDisplayTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, status, updatedAt: new Date().toISOString() }
          : task,
      ),
    );
    onUpdateTaskStatus?.(taskId, status);
  };

  return (
    <Card className="overflow-hidden rounded-[2rem] border border-[#e8ebf0] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="border-b border-[#eef2f6] pb-5 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e8ebf0] bg-white text-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-orange-300">
            <ListTodo className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Recent Tasks
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Monitor current assignments and update status fast
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="rounded-[1.5rem] border border-[#edf1f5] bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#eef2f6] bg-[#fafbfc] dark:border-slate-700 dark:bg-slate-900">
                    {getStatusIcon(task.status)}
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-base font-bold text-slate-900 dark:text-slate-100">
                      {task.title}
                    </p>
                    <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                      {getProjectName(task.projectId)} • Due{" "}
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "No due date"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge
                        variant={getStatusColor(task.status)}
                        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase"
                      >
                        {task.status}
                      </Badge>
                      <Badge
                        variant={getPriorityColor(task.priority)}
                        className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                {onUpdateTaskStatus && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {canUpdateTask(task) && task.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-[#e8ebf0] bg-white shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
                        onClick={() => {
                          handleStatusUpdate(task.id, getNextStatus(task.status));
                        }}
                      >
                        {task.status === "pending" && "Start"}
                        {task.status === "in-progress" && "Complete"}
                        {task.status === "blocked" && "Complete"}
                      </Button>
                    )}
                    {canMarkAsDone(task) && (
                      <Button
                        size="sm"
                        variant="default"
                        className="rounded-xl bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate(task.id, "completed")}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Done
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="rounded-[1.5rem] border border-dashed border-[#e8ebf0] bg-white px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            No tasks available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
