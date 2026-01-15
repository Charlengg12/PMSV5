import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  User,
  Building,
  AlertCircle,
  FileText,
  Download,
  Eye,
  BarChart3,
} from "lucide-react";
import { Project, User as UserType, Task } from "../../types";
import { apiService } from "../../utils/apiService";

interface Report {
  id: string;
  title: string;
  description: string;
  type: "project" | "task" | "user" | "financial" | "custom";
  status: "draft" | "published" | "archived";
  project_id?: string;
  shared_with?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ReportsManagerProps {
  projects: Project[];
  users: UserType[];
  tasks: Task[];
  currentUser: UserType;
}

const swalCustomClasses = {
  container: "swal-container !z-[10000]",
  popup: "swal-popup",
  title: "swal-title",
  htmlContainer: "swal-content",
  confirmButton: "swal-confirm-button",
  cancelButton: "swal-cancel-button",
  icon: "swal-icon",
};

const MIN_LOADING_TIME = 2000;

export function ReportsManager({
  projects,
  users,
  tasks,
  currentUser,
}: ReportsManagerProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "project" as Report["type"],
    status: "draft" as Report["status"],
    project_id: "",
  });

  const allProjectsValue = "__all__";

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getReports();

        if (response.error) {
          throw new Error(response.error);
        }
        const reportData = response.data || response;
        setReports(Array.isArray(reportData) ? reportData : []);
      } catch (err: any) {
        setError(err.message || "Failed to load reports");
        console.error("Reports fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "project",
      status: "draft",
      project_id: "",
    });
  };

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const showLoading = () => {
    return Swal.fire({
      title: "Processing...",
      text: "Please wait a moment",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: swalCustomClasses,
    });
  };

  // ────────────────────────────────────────────────
  // CREATE
  // ────────────────────────────────────────────────
  const handleCreate = async () => {
    const title = formData.title.trim();
    if (!title || isCreating) return;

    const result = await Swal.fire({
      title: "Create this report?",
      html: `Title: <strong>${title}</strong><br>Type: <strong>${formData.type}</strong>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Create",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!result.isConfirmed) return;

    const loadingSwal = showLoading();
    const startTime = Date.now();

    try {
      setIsCreating(true);
      const payload = {
        title,
        description: formData.description.trim(),
        type: formData.type,
        status: formData.status,
        project_id: formData.project_id || null,
      };
      const response = await apiService.createReport(payload);
      if (response.error) throw new Error(response.error);

      if (!response.data) throw new Error("No report returned");

      setReports((prev) => [response.data, ...prev]);
      resetForm();
      setShowCreateForm(false);

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) await delay(MIN_LOADING_TIME - elapsed);

      loadingSwal.close();

      Swal.fire({
        icon: "success",
        title: "Created!",
        text: "New report has been created successfully.",
        timer: 1800,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) await delay(MIN_LOADING_TIME - elapsed);

      loadingSwal.close();

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.message || "Could not create report.",
        customClass: swalCustomClasses,
      });
    } finally {
      setIsCreating(false);
    }
  };

  // ────────────────────────────────────────────────
  // UPDATE / EDIT
  // ────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!selectedReport || !formData.title.trim()) return;

    const result = await Swal.fire({
      title: "Save changes?",
      html: `Update report: <strong>${formData.title}</strong>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!result.isConfirmed) return;

    const loadingSwal = showLoading();
    const startTime = Date.now();

    try {
      const payload = {
        id: selectedReport.id,
        title: formData.title.trim(),
        description:
          formData.description.trim() || selectedReport.description || "",
        type: formData.type,
        status: formData.status,
        project_id: formData.project_id || null,
        created_by: selectedReport.created_by,
        created_at: selectedReport.created_at,
      };

      const response = await apiService.request(
        `/reports/${selectedReport.id}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      if (response.error) throw new Error(response.error);

      const updated = response.data || response;

      setReports((prev) =>
        prev.map((r) => (r.id === selectedReport.id ? { ...r, ...updated } : r))
      );

      setSelectedReport(null);
      resetForm();
      setShowEditForm(false);

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) await delay(MIN_LOADING_TIME - elapsed);

      loadingSwal.close();

      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Report has been successfully updated.",
        timer: 1800,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) await delay(MIN_LOADING_TIME - elapsed);

      loadingSwal.close();

      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.message || "Could not update report.",
        customClass: swalCustomClasses,
      });
    }
  };

  // ────────────────────────────────────────────────
  // DELETE
  // ────────────────────────────────────────────────
  const handleDelete = async (report: Report) => {
    const result = await Swal.fire({
      title: "Delete report?",
      html: `This will permanently delete <strong>"${report.title}"</strong>.<br/>This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!result.isConfirmed) return;

    const loadingSwal = showLoading();
    const startTime = Date.now();

    try {
      const response = await apiService.deleteReport(report.id);
      if (response.error) throw new Error(response.error);

      setReports((prev) => prev.filter((r) => r.id !== report.id));
      if (selectedReport?.id === report.id) {
        setSelectedReport(null);
      }

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) await delay(MIN_LOADING_TIME - elapsed);

      loadingSwal.close();

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Report has been deleted successfully.",
        timer: 1800,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) await delay(MIN_LOADING_TIME - elapsed);

      loadingSwal.close();

      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to delete report.",
        customClass: swalCustomClasses,
      });
    }
  };

  const handleExport = async (report: Report) => {
    const supervisors = users.filter((user) => user.role === "supervisor");

    if (supervisors.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "No supervisors found",
        text: "Please add a supervisor account before exporting.",
        customClass: swalCustomClasses,
      });
      return;
    }

    const inputOptions = supervisors.reduce((options, supervisor) => {
      options[supervisor.id] = supervisor.name;
      return options;
    }, {} as Record<string, string>);

    // Optional: Add confirmation before showing supervisor selection
    const confirmResult = await Swal.fire({
      title: "Export Report?",
      html: `You are about to make <strong>"${report.title}"</strong> visible to a supervisor.<br/>Continue?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Continue",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!confirmResult.isConfirmed) return;

    // Show supervisor selection
    const selectResult = await Swal.fire({
      title: "Export to supervisor",
      input: "select",
      inputOptions,
      inputPlaceholder: "Select a supervisor",
      showCancelButton: true,
      confirmButtonText: "Export",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value) {
          return "Please select a supervisor";
        }
        return null;
      },
      customClass: swalCustomClasses,
    });

    if (!selectResult.isConfirmed || !selectResult.value) return;

    // ─── Loading starts here ───
    const loadingSwal = showLoading();
    const startTime = Date.now();

    try {
      const response = await apiService.exportReport(
        report.id,
        selectResult.value
      );
      if (response.error) throw new Error(response.error);

      // Minimum loading time
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }

      loadingSwal.close();

      await Swal.fire({
        icon: "success",
        title: "Exported",
        text: "Report is now visible to the selected supervisor.",
        timer: 1800,
        showConfirmButton: false,
        customClass: swalCustomClasses,
      });
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }

      loadingSwal.close();

      await Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to export report.",
        customClass: swalCustomClasses,
      });
    }
  };

  const handleEdit = (report: Report) => {
    setSelectedReport(report);
    setFormData({
      title: report.title,
      description: report.description || "",
      type: report.type,
      status: report.status,
      project_id: report.project_id || "",
    });
    setShowEditForm(true);
  };

  const handleView = (report: Report) => {
    setSelectedReport(report);
    setShowViewForm(true);
  };

  const getStatusColor = (status: Report["status"]) => {
    switch (status) {
      case "published":
        return "default";
      case "draft":
        return "secondary";
      case "archived":
        return "outline";
      default:
        return "outline";
    }
  };

  const getTypeColor = (type: Report["type"]) => {
    switch (type) {
      case "project":
        return "default";
      case "task":
        return "secondary";
      case "user":
        return "outline";
      case "financial":
        return "destructive";
      case "custom":
        return "outline";
      default:
        return "outline";
    }
  };

  const canCreateReport =
    currentUser.role === "admin" || currentUser.role === "supervisor";
  const canEditReport = (report: Report) =>
    currentUser.role === "admin" || report.created_by === currentUser.id;

  const getFilteredReports = () => {
    if (currentUser.role === "admin") return reports;
    if (currentUser.role === "supervisor") {
      return reports.filter(
        (r) =>
          r.created_by === currentUser.id ||
          r.status === "published" ||
          (r.project_id &&
            projects.some(
              (p) => p.id === r.project_id && p.supervisor_id === currentUser.id
            )) ||
          (r.shared_with && r.shared_with.includes(currentUser.id))
      );
    }
    return reports.filter((r) => r.status === "published");
  };

  const filteredReports = getFilteredReports();

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl font-bold">
            <BarChart3 className="inline-block mr-2 mb-1 text-blue-700" />
            Reports
            </h2>
          <p className="text-sm text-muted-foreground">
            Create and manage project reports
          </p>
        </div>
        {canCreateReport && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm md:text-base"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="inline">Create Report</span>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
          <AlertCircle className="mx-auto h-10 w-10 mb-3" />
          <p className="font-medium">{error}</p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="project">Project</TabsTrigger>
            <TabsTrigger value="task">Task</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredReports.map((report) => (
                <Card
                  key={report.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {report.title}
                        </CardTitle>
                        {report.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {report.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge variant={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                        <Badge variant={getTypeColor(report.type)}>
                          {report.type}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 text-sm">
                      {report.project_id && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">
                            {projects.find((p) => p.id === report.project_id)
                              ?.name || "Unknown"}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Created by:{" "}
                          {users.find((u) => u.id === report.created_by)
                            ?.name || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Created:{" "}
                          {new Date(report.created_at).toLocaleDateString(
                            "en-PH"
                          )}
                        </span>
                        {report.updated_at !== report.created_at && (
                          <>
                            <span>•</span>
                            <span>
                              Updated:{" "}
                              {new Date(report.updated_at).toLocaleDateString(
                                "en-PH"
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(report)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(report)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      {canEditReport(report) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(report)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(report)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="project">
            <div className="text-center py-12 text-muted-foreground">
              Project-specific report summaries coming soon...
            </div>
          </TabsContent>

          <TabsContent value="task">
            <div className="text-center py-12 text-muted-foreground">
              Task analytics overview coming soon...
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <div className="text-center py-12 text-muted-foreground">
              Financial summary view coming soon...
            </div>
          </TabsContent>
        </Tabs>
      )}

      {filteredReports.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No reports found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {canCreateReport
                ? "Create your first report to start tracking analytics."
                : "No published reports are available yet."}
            </p>
            {canCreateReport && (
              <Button onClick={() => setShowCreateForm(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Report
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ────────────────────────────────────────────────
          CREATE FORM (replaces Dialog)
      ──────────────────────────────────────────────── */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="modal bg-background border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Create New Report</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateForm(false)}
                >
                  ×
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Generate a comprehensive report with customizable filters and
                data.
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter report title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter report description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) =>
                        setFormData({ ...formData, type: v as Report["type"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project Report</SelectItem>
                        <SelectItem value="task">Task Report</SelectItem>
                        <SelectItem value="user">User Report</SelectItem>
                        <SelectItem value="financial">
                          Financial Report
                        </SelectItem>
                        <SelectItem value="custom">Custom Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          status: v as Report["status"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.type === "project" && (
                  <div className="space-y-2">
                    <Label>Associated Project (optional)</Label>
                    <Select
                      value={formData.project_id || allProjectsValue}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          project_id: v === allProjectsValue ? "" : v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project or leave blank for all" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={allProjectsValue}>
                          All Projects
                        </SelectItem>
                        {projects
                          .filter(
                            (p) =>
                              currentUser.role === "admin" ||
                              p.supervisor_id === currentUser.id
                          )
                          .map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!formData.title.trim() || isCreating}
                >
                  {isCreating ? "Creating..." : "Create Report"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          EDIT FORM (replaces Dialog)
      ──────────────────────────────────────────────── */}
      {showEditForm && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Edit Report</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowEditForm(false);
                    setSelectedReport(null);
                    resetForm();
                  }}
                >
                  ×
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Update report details and regenerate data.
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Report Title</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter report title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter report description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) =>
                        setFormData({ ...formData, type: v as Report["type"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project Report</SelectItem>
                        <SelectItem value="task">Task Report</SelectItem>
                        <SelectItem value="user">User Report</SelectItem>
                        <SelectItem value="financial">
                          Financial Report
                        </SelectItem>
                        <SelectItem value="custom">Custom Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          status: v as Report["status"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.type === "project" && (
                  <div className="space-y-2">
                    <Label>Associated Project (optional)</Label>
                    <Select
                      value={formData.project_id || allProjectsValue}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          project_id: v === allProjectsValue ? "" : v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project or leave blank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={allProjectsValue}>
                          All Projects
                        </SelectItem>
                        {projects
                          .filter(
                            (p) =>
                              currentUser.role === "admin" ||
                              p.supervisor_id === currentUser.id
                          )
                          .map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditForm(false);
                    setSelectedReport(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={!formData.title.trim()}
                >
                  Update Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────
          VIEW FORM (replaces Dialog)
      ──────────────────────────────────────────────── */}
      {showViewForm && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedReport.title}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowViewForm(false)}
                >
                  ×
                </Button>
              </div>

              {selectedReport.description && (
                <p className="text-sm text-muted-foreground mb-6">
                  {selectedReport.description}
                </p>
              )}

              <div className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium mt-1">{selectedReport.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium mt-1">{selectedReport.status}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium mt-1">
                      {new Date(selectedReport.created_at).toLocaleString(
                        "en-PH"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium mt-1">
                      {new Date(selectedReport.updated_at).toLocaleString(
                        "en-PH"
                      )}
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-8 bg-muted/40 min-h-[240px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-70" />
                    <p className="text-lg font-medium mb-1">
                      Report Preview Area
                    </p>
                    <p className="text-sm">
                      Report content, charts, and detailed analytics will appear
                      here
                    </p>
                    <p className="text-xs mt-3 opacity-70">
                      (Implementation pending)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <Button
                  variant="outline"
                  onClick={() => setShowViewForm(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
