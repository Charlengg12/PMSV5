import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
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
      return projects.filter((p) => p.supervisorId === currentUser.id);
    }
    return projects.filter((p) => p.fabricatorIds.includes(currentUser.id));
  };

  const filteredProjects = getFilteredProjects();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "planning":
        return "outline";
      case "review":
        return "destructive";
      case "on-hold":
        return "destructive";
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

  return (
    <Card className="gap-3">
      <CardHeader className="w-full">
        <CardTitle className="w-full sm:w-auto">Project Overview</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-6">
          {filteredProjects.slice(0, 5).map((project) => (
            <div
              key={project.id}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm break-words">{project.name}</h4>
                  <Badge variant={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  <Badge variant={getPriorityColor(project.priority)}>
                    {project.priority}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <Progress
                    value={project.progress}
                    className="w-full sm:flex-1"
                  />
                  <span className="text-xs text-muted-foreground sm:w-12">
                    {project.progress}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground break-words">
                  Due: {new Date(project.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
          {filteredProjects.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No projects assigned to you
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
