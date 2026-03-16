import { useState } from "react";
import { createPortal } from "react-dom"; // Added this import
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  FolderOpen,
  CheckSquare,
  Users,
  PhilippinePeso,
  X,
} from "lucide-react";
import { Project, Task, User as UserType } from "../../types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { AnnouncementBoard } from "./AnnouncementBoard";

interface DashboardStatsProps {
  projects: Project[];
  tasks: Task[];
  users: UserType[];
  currentUser: UserType;
}

// Color palette for the pie chart slices
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];
const peso = "\u20B1";

const formatCompactAmount = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  const absValue = Math.abs(value);
  const formatScaled = (denominator: number, suffix: string) => {
    const scaled = Math.trunc((value / denominator) * 10) / 10;
    const formatted = scaled.toFixed(1).replace(/\.0$/, "");
    return `${formatted} ${suffix}`;
  };
  if (absValue >= 1_000_000_000_000)
    return formatScaled(1_000_000_000_000, "T");
  if (absValue >= 1_000_000_000) return formatScaled(1_000_000_000, "B");
  if (absValue >= 1_000_000) return formatScaled(1_000_000, "M");
  return Math.trunc(value).toLocaleString();
};

const navigateToView = (view: string) => {
  window.location.hash = view;
};

export function DashboardStats({
  projects,
  tasks,
  users,
  currentUser,
}: DashboardStatsProps) {
  const [showRevenueDetails, setShowRevenueDetails] = useState(false);

  const getFilteredData = () => {
    if (currentUser.role === "admin") {
      return { projects, tasks, users };
    }

    if (currentUser.role === "supervisor") {
      const filteredProjects = projects.filter(
        (p) => p.supervisorId === currentUser.id,
      );
      const filteredTasks = tasks.filter((t) =>
        filteredProjects.some((p) => p.id === t.projectId),
      );
      return {
        projects: filteredProjects,
        tasks: filteredTasks,
        users: users.filter((u) => u.role === "fabricator"),
      };
    }

    // fabricator
    const filteredTasks = tasks.filter((t) => t.assignedTo === currentUser.id);
    const filteredProjects = projects.filter((p) =>
      p.fabricatorIds.includes(currentUser.id),
    );
    return {
      projects: filteredProjects,
      tasks: filteredTasks,
      users: [],
    };
  };

  const {
    projects: filteredProjects,
    tasks: filteredTasks,
    users: filteredUsers,
  } = getFilteredData();

  // Create a safe version of data for the chart to ensure numbers are valid
  const chartData = filteredProjects
    .map((p) => ({
      name: p.name,
      value: Number(p.revenue), // Force conversion to Number
      status: p.status,
    }))
    .filter((item) => item.value > 0); // Optional: Hide projects with 0 revenue from chart

  const activeProjects = filteredProjects.filter(
    (p) => p.status === "in-progress",
  ).length;
  const completedTasks = filteredTasks.filter(
    (t) => t.status === "completed",
  ).length;

  const getRevenueData = () => {
    if (currentUser.role === "admin") {
      const totalBudget = filteredProjects.reduce(
        (sum, p) => sum + p.budget,
        0,
      );
      const totalRevenue = filteredProjects.reduce(
        (sum, p) => sum + p.revenue,
        0,
      );
      return {
        title: "Total Revenue",
        value: `${peso}${formatCompactAmount(totalRevenue)}`,
        description: `${peso}${formatCompactAmount(totalBudget)} budgeted`,
        canView: true,
      };
    }

    if (currentUser.role === "supervisor") {
      const totalBudget = filteredProjects.reduce(
        (sum, p) => sum + p.budget,
        0,
      );
      const totalSpent = filteredProjects.reduce((sum, p) => sum + p.spent, 0);
      return {
        title: "Project Budget",
        value: `${peso}${formatCompactAmount(totalBudget)}`,
        description: `${peso}${formatCompactAmount(totalSpent)} spent`,
        canView: true,
      };
    }

    // fabricator
    const totalProjectValue = filteredProjects.reduce(
      (sum, p) => sum + p.revenue,
      0,
    );
    return {
      title: "Assigned Value",
      value: `${peso}${formatCompactAmount(totalProjectValue)}`,
      description: `${filteredProjects.length} assigned projects`,
      canView: true,
    };
  };

  const revenueData = getRevenueData();

  const stats = [
    {
      title: "Active Projects",
      value: activeProjects.toString(),
      icon: FolderOpen,
      description: `${filteredProjects.length} total projects`,
      onClick: () => navigateToView("projects"),
    },
    {
      title: "Completed Tasks",
      value: completedTasks.toString(),
      icon: CheckSquare,
      description: `${filteredTasks.length} total tasks`,
      onClick: () => navigateToView("tasks"),
    },
    ...(currentUser.role !== "fabricator"
      ? [
          {
            title: "Team Members",
            value: filteredUsers.length.toString(),
            icon: Users,
            description: "Available resources",
            onClick: () => navigateToView("users"),
          },
        ]
      : []),
    {
      title: revenueData.title,
      value: revenueData.value,
      icon: PhilippinePeso,
      description: revenueData.description,
      onClick: () => {
        if (currentUser.role === "fabricator") {
          setShowRevenueDetails(true);
        } else {
          navigateToView("revenue");
        }
      },
    },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            className="cursor-pointer overflow-hidden rounded-[24px] border border-[#e8ebf0] bg-white p-0 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)] dark:border-slate-700 dark:bg-slate-900"
            onClick={stat.onClick}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 p-5 pb-4">
              <div>
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {stat.title}
                </CardTitle>
                <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {stat.value}
                </div>
              </div>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                  index === 0
                    ? "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300"
                    : index === 1
                      ? "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : index === 2
                        ? "border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900/60 dark:bg-violet-950/50 dark:text-violet-300"
                        : "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300"
                }`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="border-t border-dashed border-[#e8ebf0] px-5 py-4 dark:border-slate-700/80">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FIXED: Wrapped in createPortal to ensure it overlays the entire screen */}
      {showRevenueDetails &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden border dark:border-slate-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b dark:border-slate-700 bg-muted/30 dark:bg-slate-800 shrink-0">
                <h3 className="font-semibold text-lg flex items-center gap-2 dark:text-slate-100">
                  <PhilippinePeso className="w-5 h-5 text-green-600" />
                  Assigned Projects Distribution
                </h3>
                <button
                  onClick={() => setShowRevenueDetails(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="overflow-y-auto p-4 space-y-6">
                {filteredProjects.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No assigned projects found.
                  </p>
                ) : (
                  <>
                    {/* CHART SECTION */}
                    <div className="w-full h-[300px] flex justify-center items-center">
                      <ResponsiveContainer width="99%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) =>
                              `${peso}${value.toLocaleString()}`
                            }
                            contentStyle={{
                              backgroundColor:
                                document.documentElement.classList.contains(
                                  "dark",
                                )
                                  ? "#1e293b"
                                  : "white",
                              borderRadius: "8px",
                              border:
                                document.documentElement.classList.contains(
                                  "dark",
                                )
                                  ? "1px solid #475569"
                                  : "1px solid #e2e8f0",
                              color:
                                document.documentElement.classList.contains(
                                  "dark",
                                )
                                  ? "#f1f5f9"
                                  : "#000",
                            }}
                          />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* LIST SECTION */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Project Breakdown
                      </h4>
                      {filteredProjects.map((project, index) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-3 border dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Color Legend Dot */}
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            ></div>

                            <div className="space-y-1">
                              <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                {project.name}
                              </p>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                                  project.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : project.status === "in-progress"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {project.status.replace("-", " ")}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-700 dark:text-slate-200">
                              {peso}
                              {project.revenue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center shrink-0">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Value
                </span>
                <span className="text-lg font-bold text-green-600">
                  {revenueData.value}
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <AnnouncementBoard currentUser={currentUser} />
    </>
  );
}
