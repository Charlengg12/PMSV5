import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { DollarSign, Building } from "lucide-react";
import { Project, User } from "../../types";

interface RevenueOverviewProps {
  projects: Project[];
  currentUser: User;
  onUpdateProject?: (updatedProject: Project) => void;
}

const swalCustomClasses = {
  container: "swal-container",
  popup: "swal-popup",
  title: "swal-title",
  htmlContainer: "swal-content",
  confirmButton: "swal-confirm-button",
  cancelButton: "swal-cancel-button",
  icon: "swal-icon",
};

const MIN_LOADING_TIME = 2000; // 2 seconds minimum for loading state

const formatCompactAmount = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000) {
    const scaled = Math.trunc((value / 1_000_000) * 10) / 10;
    const formatted = scaled.toFixed(1).replace(/\.0$/, "");
    return `${formatted} M`;
  }
  return Math.trunc(value).toLocaleString();
};

export function RevenueOverview({
  projects,
  currentUser,
  onUpdateProject,
}: RevenueOverviewProps) {
  const [spentEdits, setSpentEdits] = useState<Record<string, string>>({});
  const [profitYear, setProfitYear] = useState<number | "all">("all");
  const [profitMonth, setProfitMonth] = useState<number | "all">("all");
  const [profitDay, setProfitDay] = useState<number | "all">("all");
  const peso = "\u20B1";

  useEffect(() => {
    const initial: Record<string, string> = {};
    projects.forEach((project) => {
      initial[project.id] = project.spent?.toString() || "0";
    });
    setSpentEdits(initial);
  }, [projects]);

  const getFilteredProjects = () => {
    if (currentUser.role === "admin") return projects;
    if (currentUser.role === "supervisor") {
      return projects.filter((p) => p.supervisorId === currentUser.id);
    }
    return projects.filter((p) => p.fabricatorIds.includes(currentUser.id));
  };

  const filteredProjects = getFilteredProjects();
  const canViewProjectRevenue =
    currentUser.role === "admin" || currentUser.role === "supervisor";
  const canEditSpent = canViewProjectRevenue && Boolean(onUpdateProject);

  // Calculate totals
  const totalProjectRevenue = filteredProjects.reduce(
    (sum, p) => sum + p.revenue,
    0
  );
  const totalProjectBudget = filteredProjects.reduce(
    (sum, p) => sum + p.budget,
    0
  );
  const totalProjectSpent = filteredProjects.reduce(
    (sum, p) => sum + p.spent,
    0
  );
  const projectProfit = totalProjectRevenue - totalProjectSpent;

  const getProjectDate = (project: Project) => {
    const raw = project.createdAt || project.endDate || project.startDate;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const availableYears = Array.from(
    new Set(
      projects
        .map(getProjectDate)
        .filter((d): d is Date => Boolean(d))
        .map((d) => d.getFullYear())
    )
  ).sort((a, b) => b - a);

  const filteredProfit = projects.reduce((sum, project) => {
    const d = getProjectDate(project);
    if (!d) return sum;
    const yearMatch = profitYear === "all" || d.getFullYear() === profitYear;
    const monthMatch = profitMonth === "all" || d.getMonth() + 1 === profitMonth;
    const dayMatch = profitDay === "all" || d.getDate() === profitDay;
    if (!yearMatch || !monthMatch || !dayMatch) return sum;
    return sum + (project.revenue - project.spent);
  }, 0);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleUpdateSpent = async (project: Project) => {
    const newSpentStr = spentEdits[project.id] || "0";
    const newSpent = parseFloat(newSpentStr);

    if (isNaN(newSpent) || newSpent < 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Amount",
        text: "Please enter a valid non-negative number.",
        customClass: swalCustomClasses,
      });
      return;
    }

    const confirmed = await Swal.fire({
      title: "Update Spent Amount?",
      html: `Are you sure you want to update <strong>${project.name}</strong><br/>
             Spent: <strong>${peso}${newSpent.toLocaleString()}</strong> ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!confirmed.isConfirmed) return;

    const loadingSwal = Swal.fire({
      title: "Updating...",
      text: "Saving new spent amount...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    const startTime = Date.now();

    try {
      // Perform the update via callback
      onUpdateProject?.({
        ...project,
        spent: newSpent,
      });

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }

      loadingSwal.close();

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: `Spent amount for ${project.name} has been updated.`,
        timer: 1800,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (err) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }

      loadingSwal.close();

      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Could not update the spent amount. Please try again.",
        customClass: swalCustomClasses,
      });
    }
  };

  if (currentUser.role === "fabricator") {
    const totalAllocatedRevenue = filteredProjects.reduce((sum, project) => {
      const fabricatorBudget = project.fabricatorBudgets?.find(
        (fb) => fb.fabricatorId === currentUser.id
      );
      return sum + (fabricatorBudget?.allocatedRevenue || 0);
    }, 0);

    return (
      <div className="space-y-6">
        <h2>My Revenue & Projects</h2>

        <Card className="bg-accent/10 border-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-accent" />
              Total Allocated Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-accent">
              {peso}
              {formatCompactAmount(totalAllocatedRevenue)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              From {filteredProjects.length} active project
              {filteredProjects.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {filteredProjects.map((project) => {
            const fabricatorBudget = project.fabricatorBudgets?.find(
              (fb) => fb.fabricatorId === currentUser.id
            );
            const myRevenue = fabricatorBudget?.allocatedRevenue || 0;
            const revenuePercentage =
              project.revenue > 0
                ? ((myRevenue / project.revenue) * 100).toFixed(1)
                : "0";

            return (
              <Card key={project.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{project.name}</span>
                    {myRevenue > 0 && (
                      <span className="text-accent text-base">
                        {peso}
                        {myRevenue.toLocaleString()}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Client
                        </span>
                      </div>
                      <p>{project.clientName}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Total Project Value
                        </span>
                      </div>
                      <p className="text-lg">
                        {peso}
                        {project.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {myRevenue > 0 && (
                    <div className="mt-4 p-3 bg-accent/10 rounded-lg border border-accent/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Your Allocated Revenue
                          </p>
                          <p className="text-xl text-accent">
                            {peso}
                            {myRevenue.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">
                            Your Share
                          </p>
                          <p className="text-xl">{revenuePercentage}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Project Progress
                      </span>
                      <span>{project.progress}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-xl sm:text-2xl font-bold">
          <DollarSign className="inline-block mr-2 mb-1 text-blue-700" />
          Revenue
          </h2>
        <p className="text-sm text-muted-foreground">
          Overview of project financials
        </p>
      </div>

      {canViewProjectRevenue && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Project Revenue</CardTitle>
              <DollarSign className="h-10 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">
                {peso}
                {formatCompactAmount(totalProjectRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                From {filteredProjects.length} projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Project Budget</CardTitle>
              <DollarSign className="h-10 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">
                {peso}
                {formatCompactAmount(totalProjectBudget)}
              </div>
              <p className="text-xs text-muted-foreground">Total allocated budget</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Project Spent</CardTitle>
              <DollarSign className="h-10 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">
                {peso}
                {formatCompactAmount(totalProjectSpent)}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalProjectBudget > 0
                  ? `${Math.round((totalProjectSpent / totalProjectBudget) * 100)}% of budget`
                  : "No budget set"}
              </p>
            </CardContent>
          </Card>

          {currentUser.role === "admin" && (
            <Card className="h-full">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm">Company Profit</CardTitle>
                  <div className="mt-8">
                    <p className="text-2xl text-green-500">
                      {peso}
                      {formatCompactAmount(filteredProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Profit</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <select
                    className="h-9 w-20 rounded-md border border-input bg-background px-2 text-xs"
                    value={profitYear}
                    onChange={(e) => {
                      const value = e.target.value;
                      setProfitYear(value === "all" ? "all" : Number(value));
                    }}
                  >
                    <option value="all">Year</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>

                  <select
                    className="h-9 w-20 rounded-md border border-input bg-background px-2 text-xs"
                    value={profitMonth}
                    onChange={(e) => {
                      const value = e.target.value;
                      setProfitMonth(value === "all" ? "all" : Number(value));
                    }}
                  >
                    <option value="all">Month</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>

                  <select
                    className="h-9 w-20 rounded-md border border-input bg-background px-2 text-xs"
                    value={profitDay}
                    onChange={(e) => {
                      const value = e.target.value;
                      setProfitDay(value === "all" ? "all" : Number(value));
                    }}
                  >
                    <option value="all">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent />
            </Card>
          )}
        </div>
      )}

      <div className="border-t pt-6">
        {canViewProjectRevenue && (
          <Card>
            <CardHeader>
              <CardTitle>Project Financial Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4"
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.clientName}
                      </p>
                    </div>

                    <div className="text-right space-y-2 sm:space-y-1">
                      <p className="text-sm">
                        Revenue: {peso}
                        {project.revenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Spent: {peso}
                        {project.spent.toLocaleString()} / {peso}
                        {project.budget.toLocaleString()}
                      </p>

                      {canEditSpent && (
                        <div className="flex items-center gap-2 justify-end">
                          <Input
                            type="text"
                            value={spentEdits[project.id] || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                                setSpentEdits((prev) => ({
                                  ...prev,
                                  [project.id]: value,
                                }));
                              }
                            }}
                            placeholder="Spent"
                            className="w-28 text-right"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateSpent(project)}
                            disabled={
                              spentEdits[project.id] === project.spent?.toString()
                            }
                          >
                            Update
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
