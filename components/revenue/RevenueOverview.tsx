import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { PhilippinePeso, Building } from "lucide-react";
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
const MAX_SPENT_VALUE = 999_999_999.99;
const MAX_SPENT_INTEGER_DIGITS = 9;
const MAX_SPENT_DECIMALS = 2;

const toNumberValue = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    if (normalized === "") return 0;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatCompactAmount = (value: number | string | null | undefined) => {
  const numericValue = toNumberValue(value);
  if (!Number.isFinite(numericValue)) return "0";
  const absValue = Math.abs(numericValue);
  const formatScaled = (denominator: number, suffix: string) => {
    const scaled = Math.trunc((numericValue / denominator) * 10) / 10;
    const formatted = scaled.toFixed(1).replace(/\.0$/, "");
    return `${formatted} ${suffix}`;
  };
  if (absValue >= 1_000_000_000_000) return formatScaled(1_000_000_000_000, "T");
  if (absValue >= 1_000_000_000) return formatScaled(1_000_000_000, "B");
  if (absValue >= 1_000_000) return formatScaled(1_000_000, "M");
  return Math.trunc(numericValue).toLocaleString();
};

const sanitizeSpentInput = (value: string) => {
  if (value === "") return "";
  if (!/^\d*\.?\d*$/.test(value)) return null;

  const [rawInteger, rawDecimal = ""] = value.split(".");
  const integerPart = rawInteger.slice(0, MAX_SPENT_INTEGER_DIGITS) || "0";
  const decimalPart = rawDecimal.slice(0, MAX_SPENT_DECIMALS);
  const hasDecimal = value.includes(".");
  const endsWithDecimal = value.endsWith(".");

  let next = hasDecimal ? `${integerPart}.${decimalPart}` : integerPart;
  if (endsWithDecimal && decimalPart.length === 0) {
    next = `${integerPart}.`;
  }

  const numeric = Number(next);
  if (Number.isFinite(numeric) && numeric > MAX_SPENT_VALUE) {
    return MAX_SPENT_VALUE.toFixed(MAX_SPENT_DECIMALS);
  }

  return next;
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
    setSpentEdits((prev) => {
      const next = { ...prev };
      const projectIds = new Set(projects.map((project) => project.id));

      Object.keys(next).forEach((id) => {
        if (!projectIds.has(id)) {
          delete next[id];
        }
      });

      projects.forEach((project) => {
        if (next[project.id] === undefined) {
          next[project.id] = "";
        }
      });

      return next;
    });
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
    (sum, p) => sum + toNumberValue(p.revenue),
    0
  );
  const totalProjectBudget = filteredProjects.reduce(
    (sum, p) => sum + toNumberValue(p.budget),
    0
  );
  const totalProjectSpent = filteredProjects.reduce(
    (sum, p) => sum + toNumberValue(p.spent),
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
    return sum + (toNumberValue(project.revenue) - toNumberValue(project.spent));
  }, 0);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleUpdateSpent = async (project: Project) => {
    const newSpentStr = spentEdits[project.id] ?? "";
    if (newSpentStr.trim() === "") {
      Swal.fire({
        icon: "warning",
        title: "Amount Required",
        text: "Please enter a spent amount before updating.",
        customClass: swalCustomClasses,
      });
      return;
    }
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

    if (newSpent > MAX_SPENT_VALUE) {
      Swal.fire({
        icon: "warning",
        title: "Amount Too Large",
        text: `Spent amount must be less than or equal to ${peso}${MAX_SPENT_VALUE.toLocaleString()}.`,
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

      setSpentEdits((prev) => ({
        ...prev,
        [project.id]: "",
      }));

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

        <Card className={`border-2 ${totalAllocatedRevenue >= 0 ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhilippinePeso className={`h-5 w-5 ${totalAllocatedRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              Total Allocated Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl ${totalAllocatedRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                      <span className={`text-base ${myRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                        <PhilippinePeso className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Total Project Value
                        </span>
                      </div>
                      <p className={`text-lg ${project.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {peso}
                        {project.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {myRevenue > 0 && (
                    <div className={`mt-4 p-3 rounded-lg border ${myRevenue >= 0 ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Your Allocated Revenue
                          </p>
                          <p className={`text-xl ${myRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
          <PhilippinePeso className="inline-block mr-2 mb-1 text-blue-700" />
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
              <PhilippinePeso className={`h-10 w-4 ${totalProjectRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl ${totalProjectRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
              <PhilippinePeso className={`h-10 w-4 ${totalProjectBudget >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl ${totalProjectBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {peso}
                {formatCompactAmount(totalProjectBudget)}
              </div>
              <p className="text-xs text-muted-foreground">Total allocated budget</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Project Spent</CardTitle>
              <PhilippinePeso className={`h-10 w-4 ${totalProjectSpent >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl ${totalProjectSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                    <p className={`text-2xl ${filteredProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4 ${project.revenue >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.clientName}
                      </p>
                    </div>

                    <div className="text-right space-y-2 sm:space-y-1">
                      <p className={`text-sm ${project.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Revenue: {peso}
                        {formatCompactAmount(project.revenue)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Spent: {peso}
                        {formatCompactAmount(project.spent)} / {peso}
                        {formatCompactAmount(project.budget)}
                      </p>

                      {canEditSpent && (
                        <div className="flex items-center gap-2 justify-end">
                          <Input
                            type="text"
                            value={spentEdits[project.id] || ""}
                            onChange={(e) => {
                              const sanitized = sanitizeSpentInput(
                                e.target.value
                              );
                              if (sanitized === null) return;
                              setSpentEdits((prev) => ({
                                ...prev,
                                [project.id]: sanitized,
                              }));
                            }}
                            placeholder="Spent"
                            className="w-28 text-right"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateSpent(project)}
                            disabled={
                              !spentEdits[project.id]?.trim() ||
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