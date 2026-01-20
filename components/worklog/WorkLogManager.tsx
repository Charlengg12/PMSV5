import { useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
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
import { Badge } from "../ui/badge";
import {
  Calendar,
  Edit,
  FileText,
  Plus,
  TrendingUp,
  Package,
  Trash2,
  X,
} from "lucide-react";
import { ProjectFileUpload } from "../projects/ProjectFileUpload";
import {
  Project,
  User,
  WorkLogEntry,
  Material,
  ProjectAttachment,
} from "../../types";
import Swal from "sweetalert2";

interface WorkLogManagerProps {
  currentUser: User;
  projects: Project[];
  workLogs: WorkLogEntry[];
  materials: Material[];
  onAddWorkLog: (workLog: Omit<WorkLogEntry, "id" | "createdAt">) => void;
  onUpdateWorkLog?: (id: string, workLog: Partial<WorkLogEntry>) => void;
  onDeleteWorkLog?: (id: string) => void;
  onUpdateProject?: (project: Project) => void;
}

const swalCustomClasses = {
  container: "swal-container",
  popup: "swal-popup !max-w-md",
  title: "swal-title",
  htmlContainer: "swal-content",
  confirmButton: "swal-confirm-button",
  cancelButton: "swal-cancel-button",
  icon: "swal-icon",
};

const minimumDelay = () => new Promise((resolve) => setTimeout(resolve, 2000));

export function WorkLogManager({
  currentUser,
  projects,
  workLogs,
  materials,
  onAddWorkLog,
  onUpdateWorkLog,
  onDeleteWorkLog,
  onUpdateProject,
}: WorkLogManagerProps) {
  const [selectedProject, setSelectedProject] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLogEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    progressPercentage: "",
    hoursWorked: "",
    materialsUsed: [] as string[], // array of material IDs (changed semantic)
  });

  const [editFormData, setEditFormData] = useState({
    date: "",
    description: "",
    progressPercentage: "",
    hoursWorked: "",
    materialsUsed: [] as string[], // array of material IDs
  });
  const [selectedLogFiles, setSelectedLogFiles] = useState<File[]>([]);
  const [logFileError, setLogFileError] = useState("");

  const fabricatorProjects = projects.filter(
    (p) =>
      p.fabricatorIds.includes(currentUser.id) &&
      p.status !== "pending-assignment",
  );

  const filteredWorkLogs = selectedProject
    ? workLogs.filter(
        (wl) =>
          wl.projectId === selectedProject &&
          wl.fabricatorId === currentUser.id,
      )
    : workLogs.filter((wl) => wl.fabricatorId === currentUser.id);

  const projectMaterials = selectedProject
    ? materials.filter((m) => m.projectId === selectedProject || !m.projectId)
    : materials;

  // ── VALIDATION FUNCTION ───────────────────────────────────────────────
  const validateWorkLog = async (
    data: typeof formData | typeof editFormData,
    isEdit = false,
  ): Promise<boolean> => {
    const prefix = isEdit ? "edit-" : "";

    if (!data.date) {
      await Swal.fire({
        icon: "error",
        title: "Required Field",
        text: "Date is required",
        customClass: swalCustomClasses,
      });
      document.getElementById(`${prefix}date`)?.focus();
      return false;
    }

    if (!data.description.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Required Field",
        text: "Work description is required",
        customClass: swalCustomClasses,
      });
      document.getElementById(`${prefix}description`)?.focus();
      return false;
    }

    if (!data.progressPercentage.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Required Field",
        text: "Progress percentage is required",
        customClass: swalCustomClasses,
      });
      return false;
    }

    if (!data.hoursWorked.trim()) {
      await Swal.fire({
        icon: "error",
        title: "Required Field",
        text: "Hours worked is required",
        customClass: swalCustomClasses,
      });
      return false;
    }

    const progress = Number(data.progressPercentage);
    const hours = Number(data.hoursWorked);

    if (isNaN(progress) || progress < 0 || progress > 100) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Progress",
        text: "Progress must be a number between 0 and 100",
        customClass: swalCustomClasses,
      });
      return false;
    }

    if (isNaN(hours) || hours < 0 || hours > 500) {
      await Swal.fire({
        icon: "error",
        title: "Invalid Hours",
        text: "Hours worked must be between 0 and 500",
        customClass: swalCustomClasses,
      });
      return false;
    }

    if (data.description.trim().length > 100) {
      await Swal.fire({
        icon: "error",
        title: "Too Long",
        text: "Description must be 100 characters or less",
        customClass: swalCustomClasses,
      });
      return false;
    }

    return true;
  };

  // ── HELPERS ────────────────────────────────────────────────────────────
  const getProjectName = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.name || "Unknown Project";

  const getProjectProgress = (projectId: string) =>
    projects.find((p) => p.id === projectId)?.progress || 0;

  const hasDocumentation = () => {
    const proj = projects.find((p) => p.id === selectedProject);
    if (!proj) return false;
    const hasFiles =
      Array.isArray(proj.attachments) && proj.attachments.length > 0;
    const hasLink = !!proj.documentationUrl?.trim();
    return hasFiles || hasLink;
  };

  const canSubmitForReview = () => {
    const proj = projects.find((p) => p.id === selectedProject);
    if (!proj) return false;

    const validStatuses = ["1_Assigned_to_FAB", "in-progress", "planning"];
    const invalidStatuses = [
      "2_Ready_for_Supervisor_Review",
      "3_Ready_for_Admin_Review",
      "4_Ready_for_Client_Signoff",
      "completed",
      "on-hold",
    ];

    return (
      validStatuses.includes(proj.status) &&
      !invalidStatuses.includes(proj.status) &&
      hasDocumentation() &&
      proj.progress >= 100
    );
  };

  const canManageDocumentation = () => {
    const proj = projects.find((p) => p.id === selectedProject);
    if (!proj) return false;

    if (["admin", "supervisor"].includes(currentUser.role)) return true;
    if (currentUser.role === "fabricator") {
      return proj.fabricatorIds.includes(currentUser.id);
    }
    return false;
  };

  // ── HANDLERS ───────────────────────────────────────────────────────────
  const handleInputChange = (
    field: keyof typeof formData,
    value: string | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMaterialToggle = (materialId: string) => {
    setFormData((prev) => ({
      ...prev,
      materialsUsed: prev.materialsUsed.includes(materialId)
        ? prev.materialsUsed.filter((id) => id !== materialId)
        : [...prev.materialsUsed, materialId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProject) {
      await Swal.fire({
        icon: "warning",
        title: "Project Required",
        text: "Please select a project first",
        customClass: swalCustomClasses,
      });
      return;
    }

    if (!(await validateWorkLog(formData))) return;

    const confirm = await Swal.fire({
      icon: "question",
      title: "Confirm Add Work Log",
      text: `Add work log for "${getProjectName(selectedProject)}"?`,
      showCancelButton: true,
      confirmButtonText: "Yes, Add",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "Creating work log...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    setIsSubmitting(true);

    try {
      await minimumDelay();

      const progress = Number(formData.progressPercentage);
      const hours = Number(formData.hoursWorked);

      await onAddWorkLog({
        projectId: selectedProject,
        fabricatorId: currentUser.id,
        date: formData.date,
        description: formData.description.trim(),
        progressPercentage: progress,
        hoursWorked: hours,
        materials:
          formData.materialsUsed.length > 0
            ? formData.materialsUsed
            : undefined,
      });

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Work log has been added successfully.",
        timer: 1800,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });

      setFormData({
        date: new Date().toISOString().split("T")[0],
        description: "",
        progressPercentage: "",
        hoursWorked: "",
        materialsUsed: [],
      });

      setShowAddForm(false);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add work log",
        customClass: swalCustomClasses,
      });
    } finally {
      setIsSubmitting(false);
      Swal.close();
    }
  };

  const handleAddDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetAddFormFiles();
    }
    setShowAddForm(open);
  };

  const openEditLog = (log: WorkLogEntry) => {
    setEditingLog(log);
    setEditFormData({
      date: log.date,
      description: log.description,
      progressPercentage: String(log.progressPercentage ?? ""),
      hoursWorked: String(log.hoursWorked ?? ""),
      materialsUsed: Array.isArray(log.materials) ? [...log.materials] : [],
    });
  };

  const handleEditInputChange = (
    field: keyof typeof editFormData,
    value: string | string[],
  ) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditMaterialToggle = (materialId: string) => {
    setEditFormData((prev) => ({
      ...prev,
      materialsUsed: prev.materialsUsed.includes(materialId)
        ? prev.materialsUsed.filter((id) => id !== materialId)
        : [...prev.materialsUsed, materialId],
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog || !onUpdateWorkLog) return;

    if (!(await validateWorkLog(editFormData, true))) return;

    const confirm = await Swal.fire({
      icon: "question",
      title: "Save Changes?",
      text: "Update this work log entry?",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "Updating work log...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    try {
      await minimumDelay();

      const progress = Number(editFormData.progressPercentage);
      const hours = Number(editFormData.hoursWorked);

      await onUpdateWorkLog(editingLog.id, {
        date: editFormData.date,
        description: editFormData.description.trim(),
        progressPercentage: progress,
        hoursWorked: hours,
        materials:
          editFormData.materialsUsed.length > 0
            ? editFormData.materialsUsed
            : undefined,
      });

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Work log has been updated successfully.",
        timer: 1800,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });

      setEditingLog(null);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update work log",
        customClass: swalCustomClasses,
      });
    } finally {
      Swal.close();
    }
  };

  const handleDeleteLog = async (log: WorkLogEntry) => {
    if (!onDeleteWorkLog) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete work log from ${new Date(log.date).toLocaleDateString()}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      customClass: swalCustomClasses,
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Deleting...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    try {
      await minimumDelay();
      await onDeleteWorkLog(log.id);

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Work log has been successfully removed.",
        timer: 1800,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete work log",
        customClass: swalCustomClasses,
      });
    } finally {
      Swal.close();
    }
  };

  const submitForSupervisorReview = () => {
    const proj = projects.find((p) => p.id === selectedProject);
    if (!proj || !onUpdateProject) return;

    const updated: Project = {
      ...proj,
      status: "2_Ready_for_Supervisor_Review",
    };
    onUpdateProject(updated);
  };

  const handleProjectFilesUploaded = (newAttachments: ProjectAttachment[]) => {
    const proj = projects.find((p) => p.id === selectedProject);
    if (!proj || !onUpdateProject) return;

    const updatedAttachments = [...(proj.attachments || []), ...newAttachments];
    onUpdateProject({ ...proj, attachments: updatedAttachments });
  };

  return (
    <div className="space-y-6">
      {/* ADD FORM */}
      {showAddForm &&
        createPortal(
          <div className="fixed inset-0 z-50 h-screen w-screen flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="modal bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
              <div className="sticky top-0 bg-background border-b px-6 py-4 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">Add Work Log Entry</h2>
                  <p className="text-sm text-muted-foreground">
                    Project: {getProjectName(selectedProject)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="progress">
                      Progress Contribution (%) *
                    </Label>
                    <Input
                      id="progress"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={formData.progressPercentage}
                      onChange={(e) =>
                        handleInputChange("progressPercentage", e.target.value)
                      }
                      placeholder="e.g. 5.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours Worked *</Label>
                    <Input
                      id="hours"
                      type="number"
                      min={0}
                      step={0.5}
                      value={formData.hoursWorked}
                      onChange={(e) =>
                        handleInputChange("hoursWorked", e.target.value)
                      }
                      placeholder="e.g. 4.5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Work Description *</Label>
                  <Textarea
                    id="description"
                    maxLength={100}
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe what you did today..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.description.length} / 100
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Materials Used (Optional)</Label>
                  <div className="grid gap-2 md:grid-cols-3">
                    {projectMaterials.map((m) => (
                      <div key={m.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`material-${m.id}`}
                          checked={formData.materialsUsed.includes(m.id)}
                          onChange={() => handleMaterialToggle(m.id)}
                          className="rounded border-gray-300"
                        />
                        <Label
                          htmlFor={`material-${m.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {m.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Work Log"}
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body, // This renders the modal outside your current component tree
        )}

      {/* EDIT FORM */}
      {editingLog && (
        <div className="fixed inset-0 z-50 h-full flex items-center justify-center bg-black/50">
          <div className="modal bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Edit Work Log Entry</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingLog(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editFormData.date}
                    onChange={(e) =>
                      handleEditInputChange("date", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-progress">
                    Progress Contribution (%) *
                  </Label>
                  <Input
                    id="edit-progress"
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={editFormData.progressPercentage}
                    onChange={(e) =>
                      handleEditInputChange(
                        "progressPercentage",
                        e.target.value,
                      )
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-hours">Hours Worked *</Label>
                  <Input
                    id="edit-hours"
                    type="number"
                    min={0}
                    step={0.5}
                    value={editFormData.hoursWorked}
                    onChange={(e) =>
                      handleEditInputChange("hoursWorked", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Work Description *</Label>
                <Textarea
                  id="edit-description"
                  maxLength={100}
                  value={editFormData.description}
                  onChange={(e) =>
                    handleEditInputChange("description", e.target.value)
                  }
                  rows={4}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {editFormData.description.length} / 100
                </p>
              </div>

              <div className="space-y-2">
                <Label>Materials Used (Optional)</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  {projectMaterials.map((m) => (
                    <div key={m.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-material-${m.id}`}
                        checked={editFormData.materialsUsed.includes(m.id)}
                        onChange={() => handleEditMaterialToggle(m.id)}
                        className="rounded border-gray-300"
                      />
                      <Label
                        htmlFor={`edit-material-${m.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {m.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingLog(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <FileText className="h-6 w-6" />
            Work Log & Progress Reports
          </h2>
          <p className="text-muted-foreground">
            Track your daily work progress and material usage
          </p>
        </div>

        <Button
          onClick={() => setShowAddForm(true)}
          disabled={!selectedProject}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Work Log
        </Button>
      </div>

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Select Project
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5 px-5">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a project to log work for" />
            </SelectTrigger>
            <SelectContent>
              {fabricatorProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{project.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {project.progress}% Complete
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Quick Stats + Submit for Review */}
      {selectedProject && (
        <div className="space-y-4">
          {" "}
          {/* Added spacing between the rows */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              {/* CHANGED: pt-6 to p-6 for uniform padding */}
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Project Progress</span>
                </div>
                <p className="text-2xl mt-1">
                  {getProjectProgress(selectedProject)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              {/* CHANGED: pt-6 to p-6 */}
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Work Entries</span>
                </div>
                <p className="text-2xl mt-1">{filteredWorkLogs.length}</p>
              </CardContent>
            </Card>

            <Card>
              {/* CHANGED: pt-6 to p-6 */}
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Documentation</span>
                </div>
                <p className="text-2xl mt-1">
                  {hasDocumentation() ? (
                    <span className="text-green-600">Ready</span>
                  ) : (
                    <span className="text-red-600">Missing</span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            {/* CHANGED: pt-4 pb-5 to p-6 for uniform padding */}
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    Upload files or add documentation link in Project Details
                  </p>
                  <p className="text-xs">
                    Current Progress:{" "}
                    <strong>{getProjectProgress(selectedProject)}%</strong>
                    <br />
                    Status:{" "}
                    <strong>
                      {projects.find((p) => p.id === selectedProject)?.status}
                    </strong>
                  </p>
                </div>

                <Button
                  onClick={submitForSupervisorReview}
                  disabled={!canSubmitForReview()}
                  className={
                    canSubmitForReview()
                      ? "bg-green-600 hover:bg-green-700"
                      : ""
                  }
                >
                  Submit for Supervisor Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* File Upload Section */}
      {selectedProject && canManageDocumentation() && onUpdateProject && (
        <ProjectFileUpload
          projectId={selectedProject}
          currentUserId={currentUser.id}
          onFilesUploaded={handleProjectFilesUploaded}
        />
      )}

      {/* Work Log History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Work Log History
            {selectedProject && (
              <Badge variant="outline">{getProjectName(selectedProject)}</Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-5 pb-10">
          {filteredWorkLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No work logs found</h3>
              <p className="text-muted-foreground mt-1">
                {selectedProject
                  ? "Start logging your work for this project"
                  : "Select a project to view or add work logs"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...filteredWorkLogs]
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-5 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          {new Date(log.date).toLocaleDateString("en-PH")}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline">
                            +{log.progressPercentage}% progress
                          </Badge>
                          <Badge variant="secondary">
                            {log.hoursWorked} hrs
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {onUpdateWorkLog && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditLog(log)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </Button>
                        )}

                        {onDeleteWorkLog && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteLog(log)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed mb-4">
                      {log.description}
                    </p>

                    {log.materials && log.materials.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1.5">
                          Materials Used:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {log.materials.map((materialId, i) => {
                            const mat = projectMaterials.find(
                              (m) => m.id === materialId,
                            );
                            return (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs"
                              >
                                {mat?.name ?? materialId}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Logged on {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
