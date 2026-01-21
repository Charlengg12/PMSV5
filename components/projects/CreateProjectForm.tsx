import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import Swal from "sweetalert2";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertDescription } from "../ui/alert";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
import {
  X,
  Plus,
  CalendarIcon,
  Building,
  DollarSign,
  Wallet,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import { addDays, format, setHours } from "date-fns";
import { Project, User } from "../../types";

const MAX_ALLOCATION_VALUE = 999_999_999.99;
const MAX_ALLOCATION_INTEGER_DIGITS = 9;
const MAX_ALLOCATION_DECIMALS = 2;

const formatCurrency = (value: number) =>
  `\u20B1${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getAmountFontSize = (formatted: string) => {
  const length = formatted.length;
  if (length > 20) return "0.8rem";
  if (length > 18) return "0.9rem";
  if (length > 16) return "1rem";
  if (length > 14) return "1.2rem";
  return "1.5rem";
};

const sanitizeAllocationInput = (value: string) => {
  if (value === "") return "";
  if (!/^\d*\.?\d*$/.test(value)) return null;

  const [rawInteger, rawDecimal = ""] = value.split(".");
  const integerPart = rawInteger.slice(0, MAX_ALLOCATION_INTEGER_DIGITS) || "0";
  const decimalPart = rawDecimal.slice(0, MAX_ALLOCATION_DECIMALS);
  const hasDecimal = value.includes(".");
  const endsWithDecimal = value.endsWith(".");

  let next = hasDecimal ? `${integerPart}.${decimalPart}` : integerPart;
  if (endsWithDecimal && decimalPart.length === 0) {
    next = `${integerPart}.`;
  }

  const numeric = Number(next);
  if (Number.isFinite(numeric) && numeric > MAX_ALLOCATION_VALUE) {
    return MAX_ALLOCATION_VALUE.toFixed(MAX_ALLOCATION_DECIMALS);
  }

  return next;
};

interface CreateProjectFormProps {
  currentUser: User;
  users: User[];
  onCreateProject: (
    project: Omit<Project, "id">,
  ) => void | Promise<void> | Promise<Project>;
  onClose: () => void;
}

export function CreateProjectForm({
  currentUser,
  users,
  onCreateProject,
  onClose,
}: CreateProjectFormProps) {
  const normalizeDate = (date: Date) => setHours(date, 12, 0, 0, 0);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: "medium" as Project["priority"],
    startDate: normalizeDate(new Date()),
    endDate: normalizeDate(
      new Date(new Date().setMonth(new Date().getMonth() + 1)),
    ),
    supervisorId: "",
    fabricatorIds: [] as string[],
    fabricatorAllocation: "",
    materialsAllocation: "",
    supervisorAllocation: "",
    companyAllocation: "",
    totalProjectPrice: "",
    supervisorAssignsFabricators: false,
    broadcastToSupervisors: false,
    documentationUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [selectedFabricator, setSelectedFabricator] = useState("");
  const calendarWeekdayLabels = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ];
  const calendarClassNames = {
    months: "flex flex-col gap-2",
    month: "flex flex-col gap-1",
    caption: "flex justify-center pt-1 relative items-center w-full mb-2",
    table: "w-full border-collapse",
    head_row: "grid grid-cols-7",
    head_cell:
      "text-white font-semibold text-[0.75rem] leading-none py-0 px-0 flex items-center justify-center tracking-wide",
    row: "grid grid-cols-7 mt-0.5",
    cell: "p-0 flex items-center justify-center",
    day: "size-6 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center",
    day_selected:
      "bg-accent text-accent-foreground hover:bg-accent dark:bg-[var(--sidebar-primary)] dark:text-[var(--sidebar-primary-foreground)] dark:hover:bg-[var(--sidebar-primary)]",
    day_today:
      "bg-accent text-accent-foreground dark:bg-[var(--sidebar-primary)] dark:text-[var(--sidebar-primary-foreground)] !rounded-none",
  };

  const supervisors = users.filter((u) => u.role === "supervisor");
  const fabricators = users.filter((u) => u.role === "fabricator");

  // --- DERIVED FINANCIAL VALUES ---
  const fabAlloc = parseFloat(formData.fabricatorAllocation) || 0;
  const matAlloc = parseFloat(formData.materialsAllocation) || 0;
  const supAlloc = parseFloat(formData.supervisorAllocation) || 0;
  const compAlloc = parseFloat(formData.companyAllocation) || 0;
  const today = normalizeDate(new Date());
  const minEndDate = addDays(normalizeDate(formData.startDate), 1);

  const operationalBudget = fabAlloc + matAlloc + supAlloc;
  const calculatedRevenue = operationalBudget + compAlloc;
  const projectedProfit = compAlloc;

  const revenueDisplay = formatCurrency(calculatedRevenue);
  const budgetDisplay = formatCurrency(operationalBudget);
  const profitDisplay = formatCurrency(projectedProfit);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      totalProjectPrice: calculatedRevenue.toFixed(2),
    }));
  }, [
    formData.fabricatorAllocation,
    formData.materialsAllocation,
    formData.supervisorAllocation,
    formData.companyAllocation,
  ]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Project description is required";
    }

    if (!formData.supervisorId && !formData.broadcastToSupervisors) {
      newErrors.supervisorId =
        "Supervisor selection is required unless broadcasting to all";
    }

    if (
      !formData.supervisorAssignsFabricators &&
      !formData.broadcastToSupervisors &&
      formData.fabricatorIds.length === 0
    ) {
      newErrors.fabricatorIds =
        "At least one fabricator must be assigned or supervisor must assign manually";
    }

    if (formData.endDate <= formData.startDate) {
      newErrors.endDate = "End date must be after start date";
    }

    if (
      (parseFloat(formData.fabricatorAllocation) || 0) < 0 ||
      (parseFloat(formData.materialsAllocation) || 0) < 0 ||
      (parseFloat(formData.supervisorAllocation) || 0) < 0 ||
      (parseFloat(formData.companyAllocation) || 0) < 0
    ) {
      newErrors.totalProjectPrice =
        "Allocations must be zero or positive numbers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAllocationChange = (
    field:
      | "fabricatorAllocation"
      | "materialsAllocation"
      | "supervisorAllocation"
      | "companyAllocation",
    value: string,
  ) => {
    const sanitized = sanitizeAllocationInput(value);
    if (sanitized === null) return;
    handleInputChange(field, sanitized);
  };

  const handleAddFabricator = (fabricatorId: string) => {
    if (!formData.fabricatorIds.includes(fabricatorId)) {
      handleInputChange("fabricatorIds", [
        ...formData.fabricatorIds,
        fabricatorId,
      ]);
    }
    setSelectedFabricator("");
  };

  const handleRemoveFabricator = (fabricatorId: string) => {
    handleInputChange(
      "fabricatorIds",
      formData.fabricatorIds.filter((id) => id !== fabricatorId),
    );
  };

  const missingFields = () => {
    const fields = [];
    if (!formData.name.trim()) fields.push("Project Name");
    if (!formData.description.trim()) fields.push("Description");
    if (!formData.supervisorId && !formData.broadcastToSupervisors)
      fields.push("Supervisor");
    if (
      !formData.supervisorAssignsFabricators &&
      !formData.broadcastToSupervisors &&
      formData.fabricatorIds.length === 0
    )
      fields.push("Fabricators");
    if (formData.endDate <= formData.startDate) fields.push("Valid Dates");
    return fields;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.name.length > 50) {
      Swal.fire({
        title: "Input Limit Exceeded",
        text: "Project name cannot exceed 50 characters.",
        icon: "warning",
        confirmButtonText: "Okay",
        customClass: {
          container: "swal-container",
          popup: "swal-popup",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        }
      });
      return;
    }

    if (formData.description.length > 100) {
      Swal.fire({
        title: "Input Limit Exceeded",
        text: "Project description cannot exceed 100 characters.",
        icon: "warning",
        confirmButtonText: "Okay",
         customClass: {
          container: "swal-container",
          popup: "swal-popup",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        }
      });
      return;
    }

    const missing = missingFields();
    if (missing.length > 0) {
      Swal.fire({
        title: "Incomplete Form",
        html: `Please fill up the following:<br><br><strong>${missing.join(
          "<br>",
        )}</strong>`,
        icon: "warning",
        confirmButtonText: "Okay",
         customClass: {
          container: "swal-container",
          popup: "swal-popup",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        }
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Please confirm if you want to proceed.",
      icon: "info",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Confirm",
      allowOutsideClick: false,
       customClass: {
          container: "swal-container",
          popup: "swal-popup",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        }
    });

    if (!result.isConfirmed) {
      return;
    }

    Swal.fire({
      title: "Processing...",
      text: "Please wait, your request is being processed.",
      allowOutsideClick: false,
       customClass: {
          container: "swal-container",
          popup: "swal-popup",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const shouldSupervisorAssign = formData.supervisorAssignsFabricators;
      const initialStatus: Project["status"] = shouldSupervisorAssign
        ? "0_Created"
        : "1_Assigned_to_FAB";

      const newProject: Omit<Project, "id"> = {
        name: formData.name,
        description: formData.description,
        clientName: "",
        status: initialStatus,
        priority: formData.priority,
        startDate: format(formData.startDate, "yyyy-MM-dd"),
        endDate: format(formData.endDate, "yyyy-MM-dd"),
        progress: 0,
        supervisorId: formData.supervisorId,
        fabricatorIds: formData.supervisorAssignsFabricators
          ? []
          : formData.fabricatorIds,
        budget: operationalBudget,
        revenue: calculatedRevenue,
        spent: 0,
        documentationUrl: formData.documentationUrl || undefined,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        fabricatorBudgets: [],
        broadcastToSupervisors: formData.broadcastToSupervisors,
        fabricatorAllocation: fabAlloc,
        materialsAllocation: matAlloc,
        supervisorAllocation: supAlloc,
        companyAllocation: compAlloc,
      };

      await onCreateProject(newProject);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await Swal.fire({
        title: "Project Created!",
        text: "The project was successfully created.",
        icon: "success",
        timer: 2200,
         customClass: {
          container: "swal-container",
          popup: "swal-popup",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        }
      });

      onClose();
      window.location.hash = "projects";
    } catch (err) {
      console.error("Project creation failed:", err);

      Swal.fire({
        title: "Error",
        text: "Failed to create the project. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
         customClass: {
          container: "swal-container",
          popup: "swal-popup",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        }
      });
    }
  };

  const getFabricatorName = (id: string) => {
    return users.find((u) => u.id === id)?.name || "Unknown";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="modal w-full max-w-2xl max-h-[90vh] bg-background rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Building className="h-5 w-5" />
            Create New Project
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter project name"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Enter project description"
                    className={errors.description ? "border-destructive" : ""}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: Project["priority"]) =>
                      handleInputChange("priority", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Timeline</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover
                      open={showStartCalendar}
                      onOpenChange={setShowStartCalendar}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.startDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0 overflow-hidden"
                        align="start"
                        side="bottom"
                        sideOffset={6}
                        collisionPadding={12}
                      >
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date) => {
                            if (!date) return;
                            const normalizedStart = normalizeDate(date);
                            setFormData((prev) => {
                              const normalizedEnd = normalizeDate(prev.endDate);
                              const nextEnd =
                                normalizedEnd <= normalizedStart
                                  ? addDays(normalizedStart, 1)
                                  : normalizedEnd;
                              return {
                                ...prev,
                                startDate: normalizedStart,
                                endDate: nextEnd,
                              };
                            });
                            if (errors.startDate || errors.endDate) {
                              setErrors((prev) => ({
                                ...prev,
                                startDate: "",
                                endDate: "",
                              }));
                            }
                            setShowStartCalendar(false);
                          }}
                          initialFocus
                          fixedWeeks
                          showOutsideDays={false}
                          disabled={{ before: today }}
                          weekStartsOn={0}
                          formatters={{
                            formatWeekdayName: (date) =>
                              calendarWeekdayLabels[date.getDay()],
                          }}
                          classNames={calendarClassNames}
                          className="rounded-md border p-2"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover
                      open={showEndCalendar}
                      onOpenChange={setShowEndCalendar}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.endDate, "PPP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0 overflow-hidden"
                        align="start"
                        side="bottom"
                        sideOffset={6}
                        collisionPadding={12}
                      >
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date) => {
                            if (!date) return;
                            const normalizedEnd = normalizeDate(date);
                            handleInputChange("endDate", normalizedEnd);
                            setShowEndCalendar(false);
                          }}
                          initialFocus
                          fixedWeeks
                          showOutsideDays={false}
                          disabled={{ before: minEndDate }}
                          weekStartsOn={0}
                          formatters={{
                            formatWeekdayName: (date) =>
                              calendarWeekdayLabels[date.getDay()],
                          }}
                          classNames={calendarClassNames}
                          className="rounded-md border p-2"
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.endDate && (
                      <p className="text-sm text-destructive">{errors.endDate}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Assignment */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Team Assignment</h3>

                <div className="space-y-2">
                  <Label htmlFor="supervisor">Supervisor *</Label>
                  <Select
                    value={formData.supervisorId}
                    onValueChange={(value) =>
                      handleInputChange("supervisorId", value)
                    }
                  >
                    <SelectTrigger
                      className={errors.supervisorId ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {supervisors.map((supervisor) => (
                        <SelectItem key={supervisor.id} value={supervisor.id}>
                          {supervisor.name} - {supervisor.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.supervisorId && (
                    <p className="text-sm text-destructive">
                      {errors.supervisorId}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    id="broadcastToSupervisors"
                    type="checkbox"
                    checked={formData.broadcastToSupervisors}
                    onChange={(e) => {
                      handleInputChange(
                        "broadcastToSupervisors",
                        e.target.checked,
                      );
                      if (e.target.checked) {
                        handleInputChange("supervisorId", "");
                      }
                    }}
                    className="cursor-pointer h-4 w-4"
                  />
                  <Label
                    htmlFor="broadcastToSupervisors"
                    className="cursor-pointer font-medium"
                  >
                    Send to all active supervisors
                  </Label>
                </div>
                {formData.broadcastToSupervisors && (
                  <Alert>
                    <AlertDescription>
                      All supervisors will be notified. The first to accept will
                      be assigned.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    id="supervisorAssignsFabricators"
                    type="checkbox"
                    checked={formData.supervisorAssignsFabricators}
                    onChange={(e) =>
                      handleInputChange(
                        "supervisorAssignsFabricators",
                        e.target.checked,
                      )
                    }
                    className="cursor-pointer"
                  />
                  <Label
                    htmlFor="supervisorAssignsFabricators"
                    className="cursor-pointer"
                  >
                    Supervisor will assign fabricators manually
                  </Label>
                </div>
                {formData.supervisorAssignsFabricators && (
                  <Alert>
                    <AlertDescription>
                      You can assign fabricators later from the project card using
                      the Assign action.
                    </AlertDescription>
                  </Alert>
                )}

                {!formData.supervisorAssignsFabricators &&
                  !formData.broadcastToSupervisors && (
                    <div className="space-y-2">
                      <Label>Fabricators *</Label>
                      <Select
                        value={selectedFabricator}
                        onValueChange={(value) => {
                          setSelectedFabricator(value);
                          handleAddFabricator(value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Add fabricators" />
                        </SelectTrigger>
                        <SelectContent>
                          {fabricators
                            .filter(
                              (fab) => !formData.fabricatorIds.includes(fab.id),
                            )
                            .map((fabricator) => (
                              <SelectItem
                                key={fabricator.id}
                                value={fabricator.id}
                              >
                                {fabricator.name} - {fabricator.department}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      {formData.fabricatorIds.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.fabricatorIds.map((id) => (
                            <Badge
                              key={id}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {getFabricatorName(id)}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRemoveFabricator(id);
                                }}
                                className="ml-1 rounded hover:text-bold p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      {errors.fabricatorIds && (
                        <p className="text-sm text-destructive">
                          {errors.fabricatorIds}
                        </p>
                      )}
                    </div>
                  )}
              </div>

              {/* Financial Allocation */}
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <h3 className="text-lg font-medium">Financial Allocation</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium mb-1">
                      <Briefcase className="h-4 w-4" /> Revenue
                    </div>
                    <p
                      className="font-bold text-blue-900 dark:text-blue-100 leading-tight whitespace-nowrap"
                      style={{ fontSize: getAmountFontSize(revenueDisplay) }}
                    >
                      {revenueDisplay}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      Total Client Price
                    </span>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-medium mb-1">
                      <Wallet className="h-4 w-4" /> Budget
                    </div>
                    <p
                      className="font-bold text-orange-900 dark:text-orange-100 leading-tight whitespace-nowrap"
                      style={{ fontSize: getAmountFontSize(budgetDisplay) }}
                    >
                      {budgetDisplay}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      Operational Expenses
                    </span>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium mb-1">
                      <TrendingUp className="h-4 w-4" /> Profit
                    </div>
                    <p
                      className="font-bold text-green-900 dark:text-green-100 leading-tight whitespace-nowrap"
                      style={{ fontSize: getAmountFontSize(profitDisplay) }}
                    >
                      {profitDisplay}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      Net Income
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fabricatorAllocation">
                      Fabricator Allocation (₱)
                    </Label>
                    <Input
                      id="fabricatorAllocation"
                      type="number"
                      min="0"
                      max={MAX_ALLOCATION_VALUE}
                      step="0.01"
                      value={formData.fabricatorAllocation}
                      onChange={(e) =>
                        handleAllocationChange(
                          "fabricatorAllocation",
                          e.target.value,
                        )
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Labor costs allocated to fabricators.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="materialsAllocation">
                      Materials Allocation (₱)
                    </Label>
                    <Input
                      id="materialsAllocation"
                      type="number"
                      min="0"
                      max={MAX_ALLOCATION_VALUE}
                      step="0.01"
                      value={formData.materialsAllocation}
                      onChange={(e) =>
                        handleAllocationChange(
                          "materialsAllocation",
                          e.target.value,
                        )
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Expected material expenses.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisorAllocation">
                      Supervisor Allocation (₱)
                    </Label>
                    <Input
                      id="supervisorAllocation"
                      type="number"
                      min="0"
                      max={MAX_ALLOCATION_VALUE}
                      step="0.01"
                      value={formData.supervisorAllocation}
                      onChange={(e) =>
                        handleAllocationChange(
                          "supervisorAllocation",
                          e.target.value,
                        )
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supervisor fees or overhead.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyAllocation">
                      Company Allocation (₱)
                    </Label>
                    <Input
                      id="companyAllocation"
                      type="number"
                      min="0"
                      max={MAX_ALLOCATION_VALUE}
                      step="0.01"
                      value={formData.companyAllocation}
                      onChange={(e) =>
                        handleAllocationChange(
                          "companyAllocation",
                          e.target.value,
                        )
                      }
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Company margin and other costs.
                    </p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center justify-between">
                      <span>Total Project Price (₱)</span>
                      <span className="text-muted-foreground">
                        Auto-calculated
                      </span>
                    </Label>
                    <Input
                      readOnly
                      value={calculatedRevenue.toFixed(2)}
                      placeholder="0.00"
                    />
                    {errors.totalProjectPrice && (
                      <p className="text-sm text-destructive">
                        {errors.totalProjectPrice}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Documentation */}
              <div className="space-y-4">
                <h3>Documentation (Optional)</h3>

                <div className="space-y-2">
                  <Label htmlFor="documentationUrl">
                    Google Drive Documentation URL
                  </Label>
                  <Input
                    id="documentationUrl"
                    type="url"
                    value={formData.documentationUrl}
                    onChange={(e) =>
                      handleInputChange("documentationUrl", e.target.value)
                    }
                    placeholder="https://drive.google.com/drive/folders/..."
                  />
                </div>
              </div>

              {Object.keys(errors).length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Please fix the errors above before submitting.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}