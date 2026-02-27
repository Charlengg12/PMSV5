import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Calendar as CalendarPicker } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import {
  Calendar as CalendarIcon,
  PhilippinePeso,
  Users,
  Building,
  Link,
  FileText,
  Download,
  ExternalLink,
  Edit,
  Save,
  X,
  FileText as FileIcon,
  Link as LinkIcon,
  Users as UsersIcon,
  PhilippinePeso as RevenueIcon,
  UserMinus, // Added icon for unassigning
  Trash2,
} from "lucide-react";
import { addDays, format, setHours } from "date-fns";
import { Project, User, ProjectAttachment } from "../../types";
import { ProjectFileUpload } from "./ProjectFileUpload";
import { FabricatorRevenueManager } from "./FabricatorRevenueManager";
import { apiService } from "../../utils/apiService";
import Swal from "sweetalert2";

interface ProjectDetailsProps {
  project: Project;
  users: User[];
  currentUser: User;
  onUpdateProject: (updatedProject: Project) => void;
  onClose: () => void;
}

export function ProjectDetails({
  project,
  users,
  currentUser,
  onUpdateProject,
  onClose,
}: ProjectDetailsProps) {
  const normalizeDate = (date: Date) => setHours(date, 12, 0, 0, 0);
  const parseDateValue = (value?: string) => {
    if (!value) return undefined;
    if (value.includes("T")) {
      return normalizeDate(new Date(value));
    }
    return normalizeDate(new Date(`${value}T12:00:00`));
  };
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

  const [isEditing, setIsEditing] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [editedProject, setEditedProject] = useState<Project>(project);
  const today = normalizeDate(new Date());
  const minEndDate = addDays(
    parseDateValue(editedProject.startDate) || today,
    1,
  );
  const [newFabricatorId, setNewFabricatorId] = useState<string>("");
  const [showAddFabricator, setShowAddFabricator] = useState(false);
  const [backendClientAssigned, setBackendClientAssigned] = useState(false);
  const [financialEdits, setFinancialEdits] = useState(() => ({
    budget: project.budget?.toString() ?? "",
    spent: project.spent?.toString() ?? "",
    revenue: project.revenue?.toString() ?? "",
  }));

  // ────────────────────────────────────────────────
  //  FIXED: Robust Client Detection Logic (Tracks editedProject now)
  // ────────────────────────────────────────────────
  // 1. Try to find the user object by ID (most accurate)
  const matchedUser = users.find((u) => u.id === editedProject.clientId);

  // 2. Fallback: Find by legacy clientProjectId link
  const linkedUser = users.find(
    (u) => u.role === "client" && u.clientProjectId === editedProject.id,
  );

  // 3. Construct a display object. If no user found, use project.clientName string.
  const clientDisplay =
    matchedUser ||
    linkedUser ||
    (editedProject.clientName
      ? {
          name: editedProject.clientName,
          email: "",
          id: editedProject.clientId,
        }
      : null);

  const localClientAssigned = !!clientDisplay;

  // ────────────────────────────────────────────────
  //  Validation constants
  // ────────────────────────────────────────────────
  const requiredFields = [
    { key: "name", label: "Project Name" },
    { key: "description", label: "Description" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
  ] as const;

  const MAX_NAME_LENGTH = 50;
  const MAX_DESCRIPTION_LENGTH = 100;
  const MAX_FINANCIAL_VALUE = 999_999_999.99;
  const MAX_FINANCIAL_INTEGER_DIGITS = 9;
  const MAX_FINANCIAL_DECIMALS = 2;

  const clampFinancialValue = (value: string) => {
    if (!value.trim()) return 0;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    const rounded =
      Math.round(numeric * 10 ** MAX_FINANCIAL_DECIMALS) /
      10 ** MAX_FINANCIAL_DECIMALS;
    if (rounded < 0) return 0;
    return Math.min(rounded, MAX_FINANCIAL_VALUE);
  };

  const sanitizeFinancialInput = (value: string) => {
    if (value === "") return "";
    if (!/^\d*\.?\d*$/.test(value)) return null;

    const [rawInteger, rawDecimal = ""] = value.split(".");
    const integerPart =
      rawInteger.slice(0, MAX_FINANCIAL_INTEGER_DIGITS) || "0";
    const decimalPart = rawDecimal.slice(0, MAX_FINANCIAL_DECIMALS);
    const hasDecimal = value.includes(".");
    const endsWithDecimal = value.endsWith(".");

    let next = hasDecimal ? `${integerPart}.${decimalPart}` : integerPart;
    if (endsWithDecimal && decimalPart.length === 0) {
      next = `${integerPart}.`;
    }

    const numeric = Number(next);
    if (Number.isFinite(numeric) && numeric > MAX_FINANCIAL_VALUE) {
      return MAX_FINANCIAL_VALUE.toFixed(MAX_FINANCIAL_DECIMALS);
    }

    return next;
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiService.getProjects();
        const rows = (res.data || []) as any[];
        const raw = rows.find((r: any) => r.id === project.id);
        const assigned = !!(
          raw &&
          (raw.client_id || raw.clientId || raw.client_name || raw.clientName)
        );
        if (active) setBackendClientAssigned(assigned);
      } catch {
        // ignore error
      }
    })();
    return () => {
      active = false;
    };
  }, [project.id]);

  useEffect(() => {
    if (!isEditing) return;
    setFinancialEdits({
      budget:
        typeof editedProject.budget === "number"
          ? editedProject.budget.toString()
          : "",
      spent:
        typeof editedProject.spent === "number"
          ? editedProject.spent.toString()
          : "",
      revenue:
        typeof editedProject.revenue === "number"
          ? editedProject.revenue.toString()
          : "",
    });
  }, [
    isEditing,
    editedProject.budget,
    editedProject.spent,
    editedProject.revenue,
  ]);

  const canEdit =
    currentUser.role === "admin" ||
    (currentUser.role === "supervisor" &&
      project.supervisorId === currentUser.id);

  const canManageFabricators =
    currentUser.role === "admin" ||
    (currentUser.role === "supervisor" &&
      project.supervisorId === currentUser.id);

  const canUploadFiles =
    currentUser.role === "admin" ||
    (currentUser.role === "supervisor" &&
      project.supervisorId === currentUser.id) ||
    (currentUser.role === "fabricator" &&
      project.fabricatorIds.includes(currentUser.id));

  const getSupervisorDisplay = (target: Project) => {
    if (target.supervisorId) {
      const supervisor = users.find((u) => u.id === target.supervisorId);
      return {
        name: supervisor?.name || "Unknown Supervisor",
        helper: "Project Supervisor",
      };
    }

    const pendingCount = target.pendingSupervisors?.length ?? 0;
    if (pendingCount > 0) {
      return {
        name: "Pending supervisor acceptance",
        helper: `Awaiting response from ${pendingCount} supervisor${pendingCount === 1 ? "" : "s"}`,
      };
    }

    return {
      name: "Not assigned",
      helper: "Supervisor not yet assigned",
    };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const downloadAttachment = (attachment: ProjectAttachment) => {
    if (!attachment.url) return;
    const link = document.createElement("a");
    link.href = attachment.url;
    link.download = attachment.name || "attachment";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "0_Created":
        return "outline";
      case "1_Assigned_to_FAB":
        return "secondary";
      case "2_Ready_for_Supervisor_Review":
      case "3_Ready_for_Admin_Review":
        return "destructive";
      case "4_Ready_for_Client_Signoff":
        return "default";
      default:
        return "outline";
    }
  };

  const getMissingFields = () => {
    const missing: string[] = [];

    for (const field of requiredFields) {
      const value = editedProject[field.key as keyof Project];
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0)
      ) {
        missing.push(field.label);
      }
    }

    return missing;
  };

  const updateFinancialEdit = (
    field: "budget" | "spent" | "revenue",
    value: string,
  ) => {
    const sanitized = sanitizeFinancialInput(value);
    if (sanitized === null) return;
    setFinancialEdits((prev) => ({ ...prev, [field]: sanitized }));
  };

  // ────────────────────────────────────────────────
  //  NEW: Unassign Client Handler
  // ────────────────────────────────────────────────
  const handleUnassignClient = () => {
    setEditedProject((prev) => ({
      ...prev,
      clientId: null as any, // Cast if type strictly requires string, usually ID can be null/undefined in DB
      clientName: null as any,
    }));
  };

  const handleSave = async () => {
    // ─── Character limit checks ───
    if (editedProject.name && editedProject.name.length > MAX_NAME_LENGTH) {
      Swal.fire({
        title: "Input Limit Exceeded",
        text: `Project name cannot exceed ${MAX_NAME_LENGTH} characters.`,
        icon: "warning",
        confirmButtonText: "Okay",
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      });
      return;
    }

    if (
      editedProject.description &&
      editedProject.description.length > MAX_DESCRIPTION_LENGTH
    ) {
      Swal.fire({
        title: "Input Limit Exceeded",
        text: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
        icon: "warning",
        confirmButtonText: "Okay",
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      });
      return;
    }

    // ─── Required fields check ───
    const missing = getMissingFields();
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
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      });
      return;
    }

    // ─── No changes check ───
    const normalizedProject = {
      ...editedProject,
      budget: clampFinancialValue(financialEdits.budget),
      spent: clampFinancialValue(financialEdits.spent),
      revenue: clampFinancialValue(financialEdits.revenue),
    };

    const hasChanges =
      JSON.stringify(normalizedProject) !== JSON.stringify(project);
    if (!hasChanges) {
      Swal.fire({
        icon: "info",
        title: "No changes detected",
        text: "Nothing to save.",
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
        timer: 1800,
        showConfirmButton: false,
      });
      setIsEditing(false);
      return;
    }

    // ─── Confirmation ───
    const result = await Swal.fire({
      title: "Save changes?",
      text: "This will update the project details.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, save",
      cancelButtonText: "Cancel",
      customClass: {
        container: "swal-container",
        popup: "swal-popup !max-w-md",
        title: "swal-title",
        htmlContainer: "swal-content",
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
      },
    });

    if (!result.isConfirmed) return;

    // ─── Saving... ───
    Swal.fire({
      title: "Saving...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: {
        container: "swal-container",
        popup: "swal-popup !max-w-md",
        title: "swal-title",
        htmlContainer: "swal-content",
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
      },
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Simulate save delay (replace with real API call if needed)
    setTimeout(() => {
      setEditedProject(normalizedProject);
      onUpdateProject(normalizedProject);
      setIsEditing(false);

      Swal.close();
      Swal.fire({
        title: "Saved!",
        text: "Project has been updated successfully.",
        icon: "success",
        timer: 1800,
        customClass: {
          container: "swal-container",
          popup: "swal-popup !max-w-md",
          title: "swal-title",
          htmlContainer: "swal-content",
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
        showConfirmButton: false,
      });
    }, 1200);
  };

  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleFilesUploaded = (newAttachments: ProjectAttachment[]) => {
    const updatedProject = {
      ...editedProject,
      attachments: [...(editedProject.attachments || []), ...newAttachments],
    };
    setEditedProject(updatedProject);
    onUpdateProject(updatedProject);
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    const result = await Swal.fire({
      title: "Remove file?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      customClass: {
        container: "swal-container",
        popup: "swal-popup !max-w-md",
        title: "swal-title",
        htmlContainer: "swal-content",
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
      },
    });

    if (!result.isConfirmed) return;

    const remainingAttachments = (editedProject.attachments || []).filter(
      (attachment) => attachment.id !== attachmentId,
    );
    const updatedProject = {
      ...editedProject,
      attachments: remainingAttachments,
    };
    setEditedProject(updatedProject);
    onUpdateProject(updatedProject);
  };

  const handleDocumentationUrlChange = (url: string) => {
    setEditedProject((prev) => ({ ...prev, documentationUrl: url }));
  };

  const handleAddFabricator = () => {
    if (
      newFabricatorId &&
      !editedProject.fabricatorIds.includes(newFabricatorId)
    ) {
      const updatedFabricators = [
        ...editedProject.fabricatorIds,
        newFabricatorId,
      ];
      const updatedProject = {
        ...editedProject,
        fabricatorIds: updatedFabricators,
      };
      setEditedProject(updatedProject);
      onUpdateProject(updatedProject);
      setNewFabricatorId("");
      setShowAddFabricator(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto modal">
        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {isEditing && canEdit ? (
                  <div className="space-y-3">
                    <Input
                      value={editedProject.name}
                      onChange={(e) =>
                        setEditedProject((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="text-2xl font-semibold"
                      placeholder="Project name"
                    />
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        value={editedProject.status}
                        onChange={(e) =>
                          setEditedProject((prev) => ({
                            ...prev,
                            status: e.target.value as Project["status"],
                          }))
                        }
                        className="border rounded px-2 py-1 text-sm bg-background"
                      >
                        <option value="0_Created">0_Created</option>
                        <option value="1_Assigned_to_FAB">
                          1_Assigned_to_FAB
                        </option>
                        <option value="2_Ready_for_Supervisor_Review">
                          2_Ready_for_Supervisor_Review
                        </option>
                        <option value="3_Ready_for_Admin_Review">
                          3_Ready_for_Admin_Review
                        </option>
                        <option value="4_Ready_for_Client_Signoff">
                          4_Ready_for_Client_Signoff
                        </option>
                        <option value="planning">Planning</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="completed">Completed</option>
                        <option value="on-hold">On Hold</option>
                        <option value="pending-assignment">
                          Pending Assignment
                        </option>
                      </select>
                      <select
                        value={editedProject.priority}
                        onChange={(e) =>
                          setEditedProject((prev) => ({
                            ...prev,
                            priority: e.target.value as Project["priority"],
                          }))
                        }
                        className="border rounded px-2 py-1 text-sm bg-background"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="min-w-0">
                    <CardTitle
                      className="text-2xl font-bold truncate"
                      title={editedProject.name || "Untitled Project"}
                    >
                      {editedProject.name || "Untitled Project"}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant={getStatusColor(project.status)}>
                        {editedProject.status}
                      </Badge>
                      <Badge variant="outline">
                        {editedProject.priority} priority
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              <Button variant="ghost" onClick={onClose} className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              {canEdit && !isEditing && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}

              {/* Check if ANY client is assigned (local or backend) */}
              {canEdit && localClientAssigned && !isEditing && (
                <Button variant="outline" disabled>
                  Client Assigned
                </Button>
              )}

              {isEditing && (
                <>
                  <Button
                    variant="default"
                    className="w-full sm:w-auto"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-6 sm:px-6 sm:pb-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex w-full overflow-x-auto justify-start md:grid md:grid-cols-5 h-auto p-1 bg-muted/50">
              <TabsTrigger value="overview" className="flex-1 min-w-[80px]">
                <FileIcon className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="flex-1 min-w-[80px]">
                <UsersIcon className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Team</span>
              </TabsTrigger>
              <TabsTrigger value="revenue" className="flex-1 min-w-[80px]">
                <RevenueIcon className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Revenue</span>
              </TabsTrigger>
              <TabsTrigger value="files" className="flex-1 min-w-[80px]">
                <FileIcon className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Files</span>
              </TabsTrigger>
              <TabsTrigger
                value="documentation"
                className="flex-1 min-w-[80px]"
              >
                <LinkIcon className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Docs</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 pt-5">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    {isEditing ? (
                      <Input
                        id="description"
                        value={editedProject.description || ""}
                        onChange={(e) =>
                          setEditedProject((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="mt-1.5"
                        placeholder="Enter project description..."
                      />
                    ) : (
                      <div
                        className="mt-1.5 text-sm text-muted-foreground whitespace-pre-wrap break-words line-clamp-4"
                        title={editedProject.description || ""}
                      >
                        {editedProject.description ||
                          "No description provided."}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Progress</Label>
                    <div className="space-y-1">
                      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span>{editedProject.progress}% Complete</span>
                        {isEditing && (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editedProject.progress}
                            onChange={(e) => {
                              let value = parseInt(e.target.value) || 0;

                              // Logic to prevent exceeding 100 or going below 0
                              if (value > 100) value = 100;
                              if (value < 0) value = 0;

                              setEditedProject((prev) => ({
                                ...prev,
                                progress: value,
                              }));
                            }}
                            className="w-20 h-8"
                          />
                        )}
                      </div>
                      <Progress value={editedProject.progress} />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Start Date
                      </Label>
                      {isEditing && canEdit ? (
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
                              {parseDateValue(editedProject.startDate)
                                ? format(
                                    parseDateValue(editedProject.startDate)!,
                                    "PPP",
                                  )
                                : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[min(100vw-2rem,var(--radix-popover-trigger-width))] sm:w-[calc(var(--radix-popover-trigger-width)+96px)] p-0 overflow-hidden"
                            align="start"
                            side="bottom"
                            sideOffset={6}
                            collisionPadding={12}
                          >
                            <CalendarPicker
                              mode="single"
                              selected={parseDateValue(editedProject.startDate)}
                              month={
                                parseDateValue(editedProject.startDate) || today
                              }
                              onSelect={(date) => {
                                if (!date) return;
                                const normalizedStart = normalizeDate(date);
                                setEditedProject((prev) => {
                                  const prevEnd =
                                    parseDateValue(prev.endDate) ||
                                    addDays(normalizedStart, 1);
                                  const nextEnd =
                                    prevEnd <= normalizedStart
                                      ? addDays(normalizedStart, 1)
                                      : prevEnd;
                                  return {
                                    ...prev,
                                    startDate: format(
                                      normalizedStart,
                                      "yyyy-MM-dd",
                                    ),
                                    endDate: format(nextEnd, "yyyy-MM-dd"),
                                  };
                                });
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
                      ) : (
                        <div className="mt-1.5 text-sm text-muted-foreground">
                          {parseDateValue(editedProject.startDate)
                            ? format(
                                parseDateValue(editedProject.startDate)!,
                                "PPP",
                              )
                            : "Not set"}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        End Date
                      </Label>
                      {isEditing && canEdit ? (
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
                              {parseDateValue(editedProject.endDate)
                                ? format(
                                    parseDateValue(editedProject.endDate)!,
                                    "PPP",
                                  )
                                : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[min(100vw-2rem,var(--radix-popover-trigger-width))] sm:w-[calc(var(--radix-popover-trigger-width)+96px)] p-0 overflow-hidden"
                            align="start"
                            side="bottom"
                            sideOffset={6}
                            collisionPadding={12}
                          >
                            <CalendarPicker
                              mode="single"
                              selected={parseDateValue(editedProject.endDate)}
                              month={
                                parseDateValue(editedProject.endDate) || today
                              }
                              onSelect={(date) => {
                                if (!date) return;
                                const normalizedEnd = normalizeDate(date);
                                setEditedProject((prev) => ({
                                  ...prev,
                                  endDate: format(normalizedEnd, "yyyy-MM-dd"),
                                }));
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
                      ) : (
                        <div className="mt-1.5 text-sm text-muted-foreground">
                          {parseDateValue(editedProject.endDate)
                            ? format(
                                parseDateValue(editedProject.endDate)!,
                                "PPP",
                              )
                            : "Not set"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ──────────────────────────────────────────────── */}
                  {/* FIXED: Display clientDisplay instead of clientUser */}
                  {/* ──────────────────────────────────────────────── */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Client
                    </Label>
                    {clientDisplay ? (
                      <div className="mt-1.5 flex items-center justify-between bg-muted/30 p-2 rounded-md border text-sm min-w-0">
                        <div className="min-w-0">
                          <p
                            className="font-medium truncate"
                            title={clientDisplay.name}
                          >
                            {clientDisplay.name}
                          </p>
                          {clientDisplay.email && (
                            <p
                              className="text-xs text-muted-foreground truncate"
                              title={clientDisplay.email}
                            >
                              {clientDisplay.email}
                            </p>
                          )}
                        </div>
                        {/* ── UNASSIGN BUTTON (Only in Edit Mode) ── */}
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                            onClick={handleUnassignClient}
                            title="Unassign Client"
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Unassign
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1.5 text-sm text-muted-foreground">
                        No client assigned
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-5">
                <h3 className="text-lg font-medium">Financial Overview</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {(currentUser.role === "admin" ||
                    currentUser.role === "supervisor") && (
                    <>
                      <Card>
                        <CardContent className="pt-6 px-4 sm:px-6 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <PhilippinePeso className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Budget</span>
                          </div>
                          {isEditing && currentUser.role === "admin" ? (
                            <Input
                              type="number"
                              min="0"
                              max={MAX_FINANCIAL_VALUE}
                              step="0.01"
                              value={financialEdits.budget}
                              onChange={(e) =>
                                updateFinancialEdit("budget", e.target.value)
                              }
                              className="text-2xl font-semibold"
                            />
                          ) : (
                            <p className="text-2xl font-bold">
                              ₱{editedProject.budget?.toLocaleString() || "0"}
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6 px-4 sm:px-6 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <PhilippinePeso className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Spent</span>
                          </div>
                          {isEditing && currentUser.role === "admin" ? (
                            <Input
                              type="number"
                              min="0"
                              max={MAX_FINANCIAL_VALUE}
                              step="0.01"
                              value={financialEdits.spent}
                              onChange={(e) =>
                                updateFinancialEdit("spent", e.target.value)
                              }
                              className="text-2xl font-semibold"
                            />
                          ) : (
                            <p className="text-2xl font-bold">
                              ₱{editedProject.spent?.toLocaleString() || "0"}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  )}

                  <Card>
                    <CardContent className="pt-6 px-4 sm:px-6 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <PhilippinePeso className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {currentUser.role === "fabricator"
                            ? "Project Value"
                            : "Revenue"}
                        </span>
                      </div>
                      {isEditing && currentUser.role === "admin" ? (
                        <Input
                          type="number"
                          min="0"
                          max={MAX_FINANCIAL_VALUE}
                          step="0.01"
                          value={financialEdits.revenue}
                          onChange={(e) =>
                            updateFinancialEdit("revenue", e.target.value)
                          }
                          className="text-2xl font-semibold"
                        />
                      ) : (
                        <p className="text-2xl font-bold">
                          ₱{editedProject.revenue?.toLocaleString() || "0"}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-6 pt-5">
              <Card>
                <CardHeader className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Project Team
                  </CardTitle>
                  {canManageFabricators && !showAddFabricator && (
                    <Button
                      onClick={() => setShowAddFabricator(true)}
                      variant="outline"
                      size="sm"
                    >
                      Add Fabricator
                    </Button>
                  )}
                </CardHeader>

                {canManageFabricators && showAddFabricator && (
                  <div className="px-4 pb-4 sm:px-6">
                    <Label htmlFor="fabricator-select">Select Fabricator</Label>
                    <select
                      id="fabricator-select"
                      value={newFabricatorId}
                      onChange={(e) => setNewFabricatorId(e.target.value)}
                      className="mt-1.5 border rounded px-3 py-2 w-full bg-background"
                    >
                      <option value="">-- Choose a Fabricator --</option>
                      {users
                        .filter(
                          (user) =>
                            user.role === "fabricator" &&
                            !editedProject.fabricatorIds.includes(user.id),
                        )
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                    </select>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Button
                        onClick={handleAddFabricator}
                        disabled={!newFabricatorId}
                      >
                        Add
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowAddFabricator(false);
                          setNewFabricatorId("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <CardContent className="space-y-6 px-4 pb-6 sm:px-6">
                  <div className="pb-5 border-b">
                    <Label className="flex items-center gap-2 text-base mb-3">
                      Supervisor
                    </Label>
                    {isEditing && currentUser.role === "admin" ? (
                      <select
                        value={editedProject.supervisorId}
                        onChange={(e) =>
                          setEditedProject((prev) => ({
                            ...prev,
                            supervisorId: e.target.value,
                          }))
                        }
                        className="w-full border rounded px-3 py-2 bg-background"
                      >
                        <option value="">Not assigned</option>
                        {users
                          .filter((user) => user.role === "supervisor")
                          .map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} - {user.school || "No school"}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          S
                        </div>
                        <div>
                          <p className="font-medium">
                            {getSupervisorDisplay(editedProject).name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getSupervisorDisplay(editedProject).helper}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 text-base mb-3">
                      Fabricators ({editedProject.fabricatorIds.length})
                    </Label>
                    <div className="space-y-3">
                      {editedProject.fabricatorIds.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No fabricators assigned yet.
                        </p>
                      ) : (
                        editedProject.fabricatorIds.map((fabId, index) => {
                          const fabricator = users.find((u) => u.id === fabId);
                          const fabricatorBudget =
                            project.fabricatorBudgets?.find(
                              (fb) => fb.fabricatorId === fabId,
                            );
                          const hasRevenue =
                            fabricatorBudget &&
                            fabricatorBudget.allocatedRevenue > 0;

                          return (
                            <div
                              key={fabId}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-medium shrink-0">
                                  {index + 1}
                                </div>
                                <div className="min-w-0">
                                  <p
                                    className="font-medium truncate"
                                    title={fabricator?.name || "Unknown"}
                                  >
                                    {fabricator?.name || "Unknown Fabricator"}
                                  </p>
                                  <p
                                    className="text-sm text-muted-foreground truncate"
                                    title={fabricator?.secureId || "—"}
                                  >
                                    {fabricator?.secureId || "—"}
                                  </p>
                                </div>
                              </div>
                              {hasRevenue &&
                                (currentUser.role === "admin" ||
                                  currentUser.role === "supervisor") && (
                                  <Badge
                                    variant="outline"
                                    className="shrink-0 gap-1"
                                  >
                                    <PhilippinePeso className="h-3 w-3" />₱
                                    {fabricatorBudget.allocatedRevenue.toLocaleString()}{" "}
                                    revenue
                                  </Badge>
                                )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="pt-5">
              <FabricatorRevenueManager
                project={project}
                users={users}
                currentUser={currentUser}
                onUpdateProject={onUpdateProject}
              />
            </TabsContent>

            <TabsContent value="files" className="space-y-6 pt-5">
              {canUploadFiles && (
                <ProjectFileUpload
                  projectId={project.id}
                  currentUserId={currentUser.id}
                  onFilesUploaded={handleFilesUploaded}
                />
              )}

              {editedProject.attachments &&
              editedProject.attachments.length > 0 ? (
                <Card>
                  <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Project Files ({editedProject.attachments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-6 sm:px-6">
                    <div className="space-y-2">
                      {editedProject.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 bg-muted rounded gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p
                                className="font-medium truncate"
                                title={attachment.name}
                              >
                                {attachment.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(attachment.size)} • Uploaded{" "}
                                {new Date(
                                  attachment.uploadedAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadAttachment(attachment)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                handleDeleteAttachment(attachment.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="px-4 py-10 text-center sm:px-6 sm:py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg mb-2">No files uploaded yet</h3>
                    <p className="text-muted-foreground">
                      {canUploadFiles
                        ? "Upload files using the section above."
                        : "No files have been uploaded to this project."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documentation" className="space-y-6 pt-5">
              <Card>
                <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                  <CardTitle className="flex items-center gap-2">
                    <Link className="h-5 w-5" />
                    Google Drive Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-6 sm:px-6">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Label htmlFor="docs-url">Documentation URL</Label>
                      <Input
                        id="docs-url"
                        value={editedProject.documentationUrl || ""}
                        onChange={(e) =>
                          handleDocumentationUrlChange(e.target.value)
                        }
                        placeholder="https://drive.google.com/drive/folders/..."
                        className="mt-1.5"
                      />
                    </div>
                  ) : editedProject.documentationUrl ? (
                    <div className="flex flex-col gap-3 p-4 bg-muted rounded-lg sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Link className="h-5 w-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p
                            className="font-medium truncate"
                            title="Project Documentation"
                          >
                            Project Documentation
                          </p>
                          <p
                            className="text-sm text-muted-foreground truncate"
                            title="Google Drive folder with complete project documentation"
                          >
                            Google Drive folder with complete project
                            documentation
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        asChild
                        className="w-full sm:w-auto shrink-0"
                      >
                        <a
                          href={editedProject.documentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-10">
                      <Link className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg mb-2">No documentation link</h3>
                      <p className="text-muted-foreground">
                        No Google Drive documentation has been added yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                  <CardTitle>Documentation Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-6 sm:px-6">
                  <p className="text-sm text-muted-foreground">
                    The Google Drive folder should contain:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1.5 ml-5 list-disc">
                    <li>Project specifications and requirements</li>
                    <li>Technical drawings and blueprints</li>
                    <li>Material lists and supplier information</li>
                    <li>Quality control checklists</li>
                    <li>Progress reports and photos</li>
                    <li>Client communication records</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
