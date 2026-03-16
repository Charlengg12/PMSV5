import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { format } from "date-fns";
import {
  PhilippinePeso,
  Building,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Wallet,
  Briefcase,
  Hammer,
  Package,
} from "lucide-react";
import { Material, Project, User } from "../../types";

interface RevenueOverviewProps {
  projects: Project[];
  materials: Material[];
  currentUser: User;
  users: User[];
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

const normalizeAllocation = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.abs(value) < 0.005 ? 0 : value;
};

const formatCompactAmount = (value: number | string | null | undefined) => {
  const numericValue = toNumberValue(value);
  if (!Number.isFinite(numericValue)) return "0";
  const absValue = Math.abs(numericValue);
  const formatScaled = (denominator: number, suffix: string) => {
    const scaled = Math.round((numericValue / denominator) * 10) / 10;
    const formatted = scaled.toFixed(1).replace(/\.0$/, "");
    return `${formatted} ${suffix}`;
  };
  if (absValue >= 1_000_000_000_000)
    return formatScaled(1_000_000_000_000, "T");
  if (absValue >= 1_000_000_000) return formatScaled(1_000_000_000, "B");
  if (absValue >= 1_000_000) return formatScaled(1_000_000, "M");
  return Math.round(numericValue).toLocaleString();
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

type ProjectFinancialSnapshot = {
  budget: number;
  spent: number;
  revenue: number;
  grossProjectTotal: number;
  projectBudget: number;
  projectSpent: number;
  projectTotal: number;
  totalProjectCost: number;
  totalProjectCostQuantity: number;
  companyProfit: number;
  fabricatorAllocation: number;
  materialsAllocation: number;
  supervisorAllocation: number;
  companyAllocation: number;
  hasStructuredAllocations: boolean;
};

const getProjectFinancialSnapshot = (
  project: Project,
  quantityBasedMaterialsCost: number,
): ProjectFinancialSnapshot => {
  const fabricatorAllocation = normalizeAllocation(
    toNumberValue(project.fabricatorAllocation),
  );
  const materialsAllocation = normalizeAllocation(
    toNumberValue(project.materialsAllocation),
  );
  const supervisorAllocation = normalizeAllocation(
    toNumberValue(project.supervisorAllocation),
  );
  const companyAllocation = normalizeAllocation(
    toNumberValue(project.companyAllocation),
  );
  const fallbackRevenue = normalizeAllocation(toNumberValue(project.revenue));
  const totalProjectCostQuantity =
    quantityBasedMaterialsCost > 0
      ? normalizeAllocation(quantityBasedMaterialsCost)
      : materialsAllocation;
  const totalAllocationCost =
    fabricatorAllocation +
    materialsAllocation +
    supervisorAllocation +
    companyAllocation;
  const grossProjectTotal =
    fallbackRevenue > 0 ? fallbackRevenue : totalAllocationCost;
  const projectBudget = fabricatorAllocation + supervisorAllocation;
  const projectSpent = companyAllocation;
  const totalProjectCost =
    fabricatorAllocation +
    totalProjectCostQuantity +
    supervisorAllocation +
    companyAllocation;
  const projectTotal = totalProjectCost;
  const companyProfit = grossProjectTotal - projectTotal;
  const hasStructuredAllocations =
    fabricatorAllocation > 0 ||
    materialsAllocation > 0 ||
    supervisorAllocation > 0 ||
    companyAllocation > 0;

  return {
    budget: projectBudget,
    spent: projectSpent,
    revenue: grossProjectTotal,
    grossProjectTotal,
    projectBudget,
    projectSpent,
    projectTotal,
    totalProjectCost,
    totalProjectCostQuantity,
    companyProfit,
    fabricatorAllocation,
    materialsAllocation,
    supervisorAllocation,
    companyAllocation,
    hasStructuredAllocations,
  };
};

export function RevenueOverview({
  projects,
  materials,
  currentUser,
  users,
  onUpdateProject,
}: RevenueOverviewProps) {
  const summaryCardClassName =
    "group cursor-pointer overflow-hidden rounded-[1.25rem] border border-[#e6edf5] bg-white shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/20 dark:border-slate-700 dark:bg-slate-900";
  const summaryHeaderClassName =
    "flex flex-row items-start justify-between space-y-0 px-4 pb-0 pt-4";
  const summaryContentClassName = "px-4 pb-4 pt-2.5";

  const [spentEdits, setSpentEdits] = useState<Record<string, string>>({});
  const [profitDate, setProfitDate] = useState<Date | null>(null);
  const [showProfitCalendar, setShowProfitCalendar] = useState(false);
  const [selectedFabricatorId, setSelectedFabricatorId] = useState<
    string | null
  >(null);
  const [showProjectTotals, setShowProjectTotals] = useState(false);
  const [showMaterialTotals, setShowMaterialTotals] = useState(false);
  const [showRevenueTotals, setShowRevenueTotals] = useState(false);
  const [showCompanyTotals, setShowCompanyTotals] = useState(false);
  const [showLaborTotals, setShowLaborTotals] = useState(false);
  const [showProfitTotals, setShowProfitTotals] = useState(false);
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
  const fabricators = users.filter((user) => user.role === "fabricator");
  const fabricatorAssignments = fabricators.map((fabricator) => ({
    fabricator,
    assignedProjects: filteredProjects.filter((project) =>
      project.fabricatorIds.includes(fabricator.id),
    ),
  }));
  const selectedAssignment =
    fabricatorAssignments.find(
      (assignment) => assignment.fabricator.id === selectedFabricatorId,
    ) ?? null;
  const materialCostByProjectId = materials.reduce<Record<string, number>>(
    (acc, material) => {
      const projectId = material.projectId;
      if (!projectId) return acc;
      const quantity = toNumberValue(material.quantity);
      const unitCost = toNumberValue(material.cost);
      acc[projectId] = (acc[projectId] || 0) + quantity * unitCost;
      return acc;
    },
    {},
  );
  const financialByProject = filteredProjects.reduce<
    Record<string, ProjectFinancialSnapshot>
  >((acc, project) => {
    acc[project.id] = getProjectFinancialSnapshot(
      project,
      materialCostByProjectId[project.id] || 0,
    );
    return acc;
  }, {});
  const canViewProjectRevenue =
    currentUser.role === "admin" || currentUser.role === "supervisor";
  const canEditSpent = canViewProjectRevenue && Boolean(onUpdateProject);

  const getFabricatorRevenueForProject = (
    project: Project,
    fabricatorId: string,
  ): number => {
    const explicit = project.fabricatorBudgets?.find(
      (fb) => fb.fabricatorId === fabricatorId,
    );
    if (explicit) {
      return toNumberValue(explicit.allocatedRevenue);
    }

    // Backward compatibility for projects without initialized per-fabricator budgets
    if (!project.fabricatorIds.includes(fabricatorId)) return 0;
    if (project.fabricatorIds.length === 0) return 0;
    const totalFabAllocation = toNumberValue(project.fabricatorAllocation);
    if (totalFabAllocation <= 0) return 0;
    return totalFabAllocation / project.fabricatorIds.length;
  };

  // Calculate totals
  const totalProjectRevenue = filteredProjects.reduce(
    (sum, p) => sum + (financialByProject[p.id]?.grossProjectTotal ?? 0),
    0,
  );
  const totalProjectBudget = filteredProjects.reduce(
    (sum, p) => sum + (financialByProject[p.id]?.projectBudget ?? 0),
    0,
  );
  const totalProjectSpent = filteredProjects.reduce(
    (sum, p) => sum + (financialByProject[p.id]?.projectSpent ?? 0),
    0,
  );
  const totalProjectTotal = filteredProjects.reduce(
    (sum, p) => sum + (financialByProject[p.id]?.projectTotal ?? 0),
    0,
  );
  const totalProjectCostQuantity = filteredProjects.reduce(
    (sum, p) => sum + (financialByProject[p.id]?.totalProjectCostQuantity ?? 0),
    0,
  );

  const getProjectDate = (project: Project) => {
    const raw = project.createdAt || project.endDate || project.startDate;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const isProfitDateMatch = (project: Project) => {
    if (!profitDate) return true;
    const d = getProjectDate(project);
    if (!d) return false;
    return (
      d.getFullYear() === profitDate.getFullYear() &&
      d.getMonth() === profitDate.getMonth() &&
      d.getDate() === profitDate.getDate()
    );
  };

  const filteredProfit = projects.reduce((sum, project) => {
    if (!isProfitDateMatch(project)) return sum;
    const financial = getProjectFinancialSnapshot(
      project,
      materialCostByProjectId[project.id] || 0,
    );
    return sum + financial.companyProfit;
  }, 0);
  const profitFilteredProjects = filteredProjects.filter(isProfitDateMatch);

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleUpdateSpent = async (project: Project) => {
    const newSpentStr = spentEdits[project.id] ?? "";
    if (newSpentStr.trim() === "") {
      Swal.fire({
        icon: "warning",
        title: "Amount Required",
        text: "Please enter a project allocation amount before updating.",
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
        text: `Project allocation must be less than or equal to ${peso}${MAX_SPENT_VALUE.toLocaleString()}.`,
        customClass: swalCustomClasses,
      });
      return;
    }

    const confirmed = await Swal.fire({
      title: "Update Company Allocation?",
      html: `Are you sure you want to update <strong>${project.name}</strong><br/>
             Company Allocation: <strong>${peso}${newSpent.toLocaleString()}</strong> ?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!confirmed.isConfirmed) return;

    Swal.fire({
      title: "Updating...",
      text: "Saving new project allocation...",
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
        companyAllocation: newSpent,
      });

      setSpentEdits((prev) => ({
        ...prev,
        [project.id]: "",
      }));

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }

      Swal.close();

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: `Project allocation for ${project.name} has been updated.`,
        timer: 1800,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (err) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }

      Swal.close();

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
      return sum + getFabricatorRevenueForProject(project, currentUser.id);
    }, 0);

    return (
      <div className="space-y-6">
        <h2>My Revenue & Projects</h2>

        <Card
          className={`border-2 ${totalAllocatedRevenue >= 0 ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"}`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhilippinePeso
                className={`h-5 w-5 ${totalAllocatedRevenue >= 0 ? "text-green-600" : "text-red-600"}`}
              />
              Total Allocated Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl ${totalAllocatedRevenue >= 0 ? "text-green-600" : "text-red-600"}`}
            >
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
            const financial = getProjectFinancialSnapshot(
              project,
              materialCostByProjectId[project.id] || 0,
            );
            const myRevenue = getFabricatorRevenueForProject(
              project,
              currentUser.id,
            );
            const revenuePercentage =
              financial.revenue > 0
                ? ((myRevenue / financial.revenue) * 100).toFixed(1)
                : "0";

            return (
              <Card key={project.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{project.name}</span>
                    {myRevenue > 0 && (
                      <span
                        className={`text-base ${myRevenue >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
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
                      <p
                        className={`text-lg ${financial.revenue >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {peso}
                        {financial.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {myRevenue > 0 && (
                    <div
                      className={`mt-4 p-3 rounded-lg border ${myRevenue >= 0 ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Your Allocated Revenue
                          </p>
                          <p
                            className={`text-xl ${myRevenue >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
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
        <div className="flex items-center gap-3">
          <PhilippinePeso className="h-6 w-6 text-orange-400" />
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">
            Revenue
          </h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Overview of project financials
        </p>
      </div>

      {canViewProjectRevenue && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            role="button"
            tabIndex={0}
            onClick={() => setShowRevenueTotals(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setShowRevenueTotals(true);
              }
            }}
            className={summaryCardClassName}
          >
            <CardHeader className={summaryHeaderClassName}>
              <div className="space-y-1">
                <CardTitle className="text-[0.95rem] font-medium text-[#4f6b95] dark:text-slate-300">
                  Client Budget
                </CardTitle>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] border border-[#d8e9ff] bg-[#eef6ff] dark:border-slate-600 dark:bg-slate-800">
                <Wallet
                  className={`h-4.5 w-4.5 ${totalProjectRevenue >= 0 ? "text-[#2563eb]" : "text-[#dc2626]"}`}
                />
              </div>
            </CardHeader>
            <CardContent className={summaryContentClassName}>
              <div
                className={`text-[1.55rem] font-bold leading-none tracking-[-0.03em] ${totalProjectRevenue >= 0 ? "text-[#0f2d5c] dark:text-white" : "text-[#b91c1c]"}`}
              >
                {peso}
                {formatCompactAmount(totalProjectRevenue)}
              </div>
              <p className="mt-2 text-[0.9rem] leading-5 text-[#5f789c] dark:text-slate-400">
                Total client budget
              </p>
            </CardContent>
          </Card>

          {currentUser.role === "admin" && (
            <Card
              role="button"
              tabIndex={0}
              onClick={() => setShowProfitTotals(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setShowProfitTotals(true);
                }
              }}
              className={summaryCardClassName}
            >
              <CardHeader className={summaryHeaderClassName}>
                <CardTitle className="text-[0.95rem] font-medium text-[#4f6b95] dark:text-slate-300">Project Profit</CardTitle>
                <div
                  className="flex items-center gap-2"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  {profitDate && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
                      onClick={(event) => {
                        event.stopPropagation();
                        setProfitDate(null);
                      }}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      All dates
                    </button>
                  )}
                  <Popover
                    open={showProfitCalendar}
                    onOpenChange={setShowProfitCalendar}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-xl border-[#dbe6f4] px-2 text-xs text-[#4f6b95]"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                        <span className="max-w-[140px] truncate">
                          {profitDate
                            ? format(profitDate, "MMM d, yyyy")
                            : "Select date"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="min-w-[356px] p-0 overflow-hidden"
                      align="end"
                      side="bottom"
                      sideOffset={6}
                      collisionPadding={12}
                      onOpenAutoFocus={(event) => event.preventDefault()}
                    >
                      <Calendar
                        mode="single"
                        selected={profitDate ?? undefined}
                        onSelect={(date) => {
                          if (!date) return;
                          setProfitDate(
                            new Date(
                              date.getFullYear(),
                              date.getMonth(),
                              date.getDate(),
                            ),
                          );
                          setShowProfitCalendar(false);
                        }}
                        initialFocus
                        fixedWeeks
                        showOutsideDays={false}
                        weekStartsOn={0}
                        className="rounded-md border p-2"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent className={summaryContentClassName}>
                <p
                  className={`text-[1.55rem] font-bold leading-none tracking-[-0.03em] ${filteredProfit >= 0 ? "text-[#0f2d5c] dark:text-white" : "text-[#b91c1c]"}`}
                >
                  {peso}
                  {formatCompactAmount(filteredProfit)}
                </p>
                <p className="mt-2 text-[0.9rem] leading-5 text-[#5f789c] dark:text-slate-400">
                  Filtered project profit
                </p>
              </CardContent>
            </Card>
          )}

          <Card
            role="button"
            tabIndex={0}
            onClick={() => setShowProjectTotals(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setShowProjectTotals(true);
              }
            }}
            className={summaryCardClassName}
          >
            <CardHeader className={summaryHeaderClassName}>
              <CardTitle className="text-[0.95rem] font-medium text-[#4f6b95] dark:text-slate-300">Total Cost</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] border border-[#dce6f5] bg-[#f7faff] dark:border-slate-600 dark:bg-slate-800">
                <Briefcase
                  className={`h-4.5 w-4.5 ${totalProjectTotal >= 0 ? "text-[#64748b]" : "text-[#dc2626]"}`}
                />
              </div>
            </CardHeader>
            <CardContent className={summaryContentClassName}>
              <div
                className={`text-[1.55rem] font-bold leading-none tracking-[-0.03em] ${totalProjectTotal >= 0 ? "text-[#0f2d5c] dark:text-white" : "text-[#b91c1c]"}`}
              >
                {peso}
                {formatCompactAmount(totalProjectTotal)}
              </div>
              <p className="mt-2 text-[0.9rem] leading-5 text-[#5f789c] dark:text-slate-400">
                Combined project cost for {filteredProjects.length} project
                {filteredProjects.length !== 1 ? "s" : ""} in view
              </p>
            </CardContent>
          </Card>

          <Card
            role="button"
            tabIndex={0}
            onClick={() => setShowCompanyTotals(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setShowCompanyTotals(true);
              }
            }}
            className={summaryCardClassName}
          >
            <CardHeader className={summaryHeaderClassName}>
              <CardTitle className="text-[0.95rem] font-medium text-[#4f6b95] dark:text-slate-300">Company Allocation</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] border border-[#fee7c8] bg-[#fff7ed] dark:border-slate-600 dark:bg-slate-800">
                <Building
                  className={`h-4.5 w-4.5 ${totalProjectSpent >= 0 ? "text-[#f97316]" : "text-[#dc2626]"}`}
                />
              </div>
            </CardHeader>
            <CardContent className={summaryContentClassName}>
              <div
                className={`text-[1.55rem] font-bold leading-none tracking-[-0.03em] ${totalProjectSpent >= 0 ? "text-[#0f2d5c] dark:text-white" : "text-[#b91c1c]"}`}
              >
                {peso}
                {formatCompactAmount(totalProjectSpent)}
              </div>
              <p className="mt-2 text-[0.9rem] leading-5 text-[#5f789c] dark:text-slate-400">
                Company costs
              </p>
            </CardContent>
          </Card>

          <Card
            role="button"
            tabIndex={0}
            onClick={() => setShowLaborTotals(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setShowLaborTotals(true);
              }
            }}
            className={summaryCardClassName}
          >
            <CardHeader className={summaryHeaderClassName}>
              <CardTitle className="text-[0.95rem] font-medium text-[#4f6b95] dark:text-slate-300">Labor Allocation</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] border border-[#dbeafe] bg-[#eff6ff] dark:border-slate-600 dark:bg-slate-800">
                <Hammer
                  className={`h-4.5 w-4.5 ${totalProjectBudget >= 0 ? "text-[#2563eb]" : "text-[#dc2626]"}`}
                />
              </div>
            </CardHeader>
            <CardContent className={summaryContentClassName}>
              <div
                className={`text-[1.55rem] font-bold leading-none tracking-[-0.03em] ${totalProjectBudget >= 0 ? "text-[#0f2d5c] dark:text-white" : "text-[#b91c1c]"}`}
              >
                {peso}
                {formatCompactAmount(totalProjectBudget)}
              </div>
              <p className="mt-2 text-[0.9rem] leading-5 text-[#5f789c] dark:text-slate-400">
                Fabricator + Supervisor
              </p>
            </CardContent>
          </Card>

          {currentUser.role === "admin" && (
            <Card
              role="button"
              tabIndex={0}
              onClick={() => setShowMaterialTotals(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setShowMaterialTotals(true);
                }
              }}
              className={summaryCardClassName}
            >
              <CardHeader className={summaryHeaderClassName}>
                <CardTitle className="text-[0.95rem] font-medium text-[#4f6b95] dark:text-slate-300">Total Cost Quantity</CardTitle>
                <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] border border-[#fee2e2] bg-[#fff5f5] dark:border-slate-600 dark:bg-slate-800">
                  <Package
                    className={`h-4.5 w-4.5 ${totalProjectCostQuantity >= 0 ? "text-[#ef4444]" : "text-[#dc2626]"}`}
                  />
                </div>
              </CardHeader>
              <CardContent className={summaryContentClassName}>
                <div
                  className={`text-[1.55rem] font-bold leading-none tracking-[-0.03em] ${totalProjectCostQuantity >= 0 ? "text-[#0f2d5c] dark:text-white" : "text-[#b91c1c]"}`}
                >
                  {peso}
                  {formatCompactAmount(totalProjectCostQuantity)}
                </div>
                <p className="mt-2 text-[0.9rem] leading-5 text-[#5f789c] dark:text-slate-400">
                  Quantity-based material total
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="border-t pt-6 flex flex-col gap-6">
        {canViewProjectRevenue && (
          <Card className="order-2">
            <CardHeader className="pb-0">
              <CardTitle>Project Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-1">
              <div className="space-y-4">
                {filteredProjects.map((project) => {
                  const financial =
                    financialByProject[project.id] ??
                    getProjectFinancialSnapshot(
                      project,
                      materialCostByProjectId[project.id] || 0,
                    );
                  return (
                    <div
                      key={project.id}
                      className={`grid gap-4 rounded-lg border p-4 ${financial.revenue >= 0 ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800"} lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]`}
                    >
                      <div className="space-y-3">
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.clientName}
                        </p>
                        {financial.hasStructuredAllocations && (
                          <div className="mt-1 rounded-md border bg-muted/40 px-2 py-1.5">
                            <p className="text-xs font-medium text-foreground">
                              Financial Structure
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Fabricator: {peso}
                              {formatCompactAmount(
                                financial.fabricatorAllocation,
                              )}{" "}
                              | Materials: {peso}
                              {formatCompactAmount(
                                financial.materialsAllocation,
                              )}{" "}
                              | Supervisor: {peso}
                              {formatCompactAmount(
                                financial.supervisorAllocation,
                              )}{" "}
                              | Company: {peso}
                              {formatCompactAmount(financial.companyAllocation)}
                            </p>
                          </div>
                        )}

                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          <div className="rounded-md border bg-muted/30 p-2">
                            <p className="text-xs text-muted-foreground">
                              Client Budget
                            </p>
                            <p className="text-sm font-semibold">
                              {peso}
                              {formatCompactAmount(financial.grossProjectTotal)}
                            </p>
                          </div>
                          <div className="rounded-md border bg-muted/30 p-2">
                            <p className="text-xs text-muted-foreground">
                              Operational Expenses
                            </p>
                            <p className="text-sm font-semibold">
                              {peso}
                              {formatCompactAmount(financial.projectBudget)}
                            </p>
                          </div>
                          <div className="rounded-md border bg-muted/30 p-2">
                            <p className="text-xs text-muted-foreground">
                              Company Allocation
                            </p>
                            <p className="text-sm font-semibold">
                              {peso}
                              {formatCompactAmount(financial.projectSpent)}
                            </p>
                          </div>
                          <div className="rounded-md border bg-muted/30 p-2">
                            <p className="text-xs text-muted-foreground">
                              Total Cost
                            </p>
                            <p className="text-sm font-semibold">
                              {peso}
                              {formatCompactAmount(financial.projectTotal)}
                            </p>
                          </div>
                          <div className="rounded-md border bg-muted/30 p-2">
                            <p className="text-xs text-muted-foreground">
                              Project Profit
                            </p>
                            <p
                              className={`text-sm font-semibold ${financial.companyProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {peso}
                              {formatCompactAmount(financial.companyProfit)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 lg:border-l lg:pl-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          Update Company Allocation
                        </p>
                        {canEditSpent && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-end">
                            <Input
                              type="text"
                              value={spentEdits[project.id] || ""}
                              onChange={(e) => {
                                const sanitized = sanitizeSpentInput(
                                  e.target.value,
                                );
                                if (sanitized === null) return;
                                setSpentEdits((prev) => ({
                                  ...prev,
                                  [project.id]: sanitized,
                                }));
                              }}
                              placeholder="Company Allocation"
                              className="w-full text-left sm:w-42 sm:text-right"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdateSpent(project)}
                              disabled={
                                !spentEdits[project.id]?.trim() ||
                                toNumberValue(spentEdits[project.id]) ===
                                  financial.projectSpent
                              }
                              className="w-full sm:w-auto"
                            >
                              Update
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {currentUser.role === "admin" && (
          <>
            <Card className="order-1">
              <CardHeader className="pb-0">
                <CardTitle>Fabricator Project Assignments</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-1">
                {fabricatorAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No fabricators available.
                  </p>
                ) : (
                  <div className="rounded-lg border">
                    <Table className="min-w-[980px]">
                      <TableHeader className="bg-[#103055] [&_th]:text-white">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="!p-2">Fabricator</TableHead>
                          <TableHead className="!p-2">Role</TableHead>
                          <TableHead className="!p-2">School</TableHead>
                          <TableHead className="!p-2">Contact</TableHead>
                          <TableHead className="!p-2">Employee No.</TableHead>
                          <TableHead className="!p-2 text-right">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fabricatorAssignments.map(({ fabricator }) => (
                          <TableRow key={fabricator.id}>
                              <TableCell className="!p-2 align-top whitespace-normal min-w-[240px]">
                                <p className="font-medium">{fabricator.name}</p>
                                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                  <Mail size={13} className="shrink-0 mt-0.5" />
                                  <span className="break-words [overflow-wrap:anywhere]">
                                    {fabricator.email}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell className="!p-2 align-top">
                                <Badge
                                  variant="secondary"
                                  className="font-medium capitalize"
                                >
                                  {fabricator.role}
                                </Badge>
                              </TableCell>

                              <TableCell className="!p-2 align-top text-muted-foreground whitespace-normal min-w-[180px]">
                                {fabricator.school || "—"}
                              </TableCell>

                              <TableCell className="!p-2 align-top whitespace-normal min-w-[220px]">
                                {fabricator.phone ? (
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Phone
                                      size={14}
                                      className="shrink-0 text-muted-foreground"
                                    />
                                    {fabricator.phone}
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">
                                    —
                                  </div>
                                )}
                                {fabricator.gcashNumber && (
                                  <div className="text-xs text-muted-foreground/80 mt-1 italic">
                                    GCash: {fabricator.gcashNumber}
                                  </div>
                                )}
                              </TableCell>

                              <TableCell className="!p-2 align-top">
                                <code className="text-xs font-mono text-muted-foreground">
                                  {fabricator.employeeNumber || "—"}
                                </code>
                              </TableCell>

                              <TableCell className="!p-2 align-top text-right">
                                <button
                                  type="button"
                                  className="text-sm font-medium text-primary hover:underline underline-offset-4"
                                  onClick={() =>
                                    setSelectedFabricatorId(fabricator.id)
                                  }
                                >
                                  View Projects
                                </button>
                              </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Dialog
              open={Boolean(selectedFabricatorId)}
              onOpenChange={(open) => {
                if (!open) setSelectedFabricatorId(null);
              }}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Projects for{" "}
                    {selectedAssignment?.fabricator.name ?? "Fabricator"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedAssignment?.assignedProjects.length ?? 0} assigned
                    project
                    {(selectedAssignment?.assignedProjects.length ?? 0) !== 1
                      ? "s"
                      : ""}
                  </DialogDescription>
                </DialogHeader>

                {selectedAssignment?.assignedProjects.length ? (
                  <div className="space-y-2">
                    {selectedAssignment.assignedProjects.map((project) => (
                      <div
                        key={project.id}
                        className="rounded-md border bg-muted/30 px-3 py-2 text-sm"
                      >
                        {project.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No assigned projects.
                  </p>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}

        <Dialog open={showProjectTotals} onOpenChange={setShowProjectTotals}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Total Cost Breakdown</DialogTitle>
              <DialogDescription>
                {filteredProjects.length} project
                {filteredProjects.length !== 1 ? "s" : ""} included in total
              </DialogDescription>
            </DialogHeader>

            {filteredProjects.length ? (
              <div className="space-y-2">
                {filteredProjects.map((project) => {
                  const financial =
                    financialByProject[project.id] ??
                    getProjectFinancialSnapshot(
                      project,
                      materialCostByProjectId[project.id] || 0,
                    );
                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{project.name}</span>
                      <span className="text-muted-foreground">
                        {peso}
                        {formatCompactAmount(financial.projectTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No projects available.
              </p>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showMaterialTotals} onOpenChange={setShowMaterialTotals}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Material Cost Breakdown</DialogTitle>
              <DialogDescription>
                {filteredProjects.length} project
                {filteredProjects.length !== 1 ? "s" : ""} included
              </DialogDescription>
            </DialogHeader>

            {filteredProjects.length ? (
              <div className="space-y-2">
                {filteredProjects.map((project) => {
                  const financial =
                    financialByProject[project.id] ??
                    getProjectFinancialSnapshot(
                      project,
                      materialCostByProjectId[project.id] || 0,
                    );
                  const materialTotal = financial.totalProjectCostQuantity;
                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{project.name}</span>
                      <span className="text-muted-foreground">
                        {peso}
                        {formatCompactAmount(materialTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No projects available.
              </p>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showRevenueTotals} onOpenChange={setShowRevenueTotals}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Client Budget Breakdown</DialogTitle>
              <DialogDescription>
                {filteredProjects.length} project
                {filteredProjects.length !== 1 ? "s" : ""} included
              </DialogDescription>
            </DialogHeader>

            {filteredProjects.length ? (
              <div className="space-y-2">
                {filteredProjects.map((project) => {
                  const financial =
                    financialByProject[project.id] ??
                    getProjectFinancialSnapshot(
                      project,
                      materialCostByProjectId[project.id] || 0,
                    );
                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{project.name}</span>
                      <span className="text-muted-foreground">
                        {peso}
                        {formatCompactAmount(financial.grossProjectTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No projects available.
              </p>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showCompanyTotals} onOpenChange={setShowCompanyTotals}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Company Allocation Breakdown</DialogTitle>
              <DialogDescription>
                {filteredProjects.length} project
                {filteredProjects.length !== 1 ? "s" : ""} included
              </DialogDescription>
            </DialogHeader>

            {filteredProjects.length ? (
              <div className="space-y-2">
                {filteredProjects.map((project) => {
                  const financial =
                    financialByProject[project.id] ??
                    getProjectFinancialSnapshot(
                      project,
                      materialCostByProjectId[project.id] || 0,
                    );
                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{project.name}</span>
                      <span className="text-muted-foreground">
                        {peso}
                        {formatCompactAmount(financial.companyAllocation)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No projects available.
              </p>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showProfitTotals} onOpenChange={setShowProfitTotals}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Project Profit Breakdown</DialogTitle>
              <DialogDescription>
                {profitFilteredProjects.length} project
                {profitFilteredProjects.length !== 1 ? "s" : ""} included
              </DialogDescription>
            </DialogHeader>

            {profitFilteredProjects.length ? (
              <div className="space-y-2">
                {profitFilteredProjects.map((project) => {
                  const financial =
                    financialByProject[project.id] ??
                    getProjectFinancialSnapshot(
                      project,
                      materialCostByProjectId[project.id] || 0,
                    );
                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{project.name}</span>
                      <span
                        className={`text-muted-foreground ${
                          financial.companyProfit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {peso}
                        {formatCompactAmount(financial.companyProfit)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No projects available.
              </p>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showLaborTotals} onOpenChange={setShowLaborTotals}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Labor Allocation Breakdown</DialogTitle>
              <DialogDescription>
                {filteredProjects.length} project
                {filteredProjects.length !== 1 ? "s" : ""} included
              </DialogDescription>
            </DialogHeader>

            {filteredProjects.length ? (
              <div className="space-y-2">
                {filteredProjects.map((project) => {
                  const financial =
                    financialByProject[project.id] ??
                    getProjectFinancialSnapshot(
                      project,
                      materialCostByProjectId[project.id] || 0,
                    );
                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{project.name}</span>
                      <span className="text-muted-foreground">
                        {peso}
                        {formatCompactAmount(financial.projectBudget)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No projects available.
              </p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
