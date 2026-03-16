import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { FolderKanban } from "lucide-react";
import { Project, User } from "../../types";

interface ProjectOverviewProps {
  projects: Project[];
  currentUser: User;
}

export function ProjectOverview({
  projects,
  currentUser,
}: ProjectOverviewProps) {
  const getFilteredProjects = () => {
    if (currentUser.role === "admin") {
      return projects;
    }
    if (currentUser.role === "supervisor") {
      return projects.filter((project) => project.supervisorId === currentUser.id);
    }
    return projects.filter((project) => project.fabricatorIds.includes(currentUser.id));
  };

  const filteredProjects = getFilteredProjects();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "review":
      case "on-hold":
        return "destructive";
      case "planning":
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

  return (
    <Card className="overflow-hidden rounded-[2rem] border border-[#e8ebf0] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
      <CardHeader className="border-b border-[#eef2f6] pb-5 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e8ebf0] bg-white text-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-orange-300">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Project Overview
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track progress, priority, and delivery dates
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        {filteredProjects.slice(0, 5).map((project) => (
          <div
            key={project.id}
            className="rounded-[1.5rem] border border-[#edf1f5] bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h4 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                    {project.name}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Due {new Date(project.endDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={getStatusColor(project.status)}
                    className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase"
                  >
                    {project.status.replace(/-/g, " ")}
                  </Badge>
                  <Badge
                    variant={getPriorityColor(project.priority)}
                    className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase"
                  >
                    {project.priority}
                  </Badge>
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-[#eef2f6] bg-[#fafbfc] p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                    Progress
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {project.progress}%
                  </span>
                </div>
                <Progress value={project.progress} className="h-2.5 bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && (
          <div className="rounded-[1.5rem] border border-dashed border-[#e8ebf0] bg-white px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            No projects assigned to you
          </div>
        )}
      </CardContent>
    </Card>
  );
}
