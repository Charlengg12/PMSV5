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
  Search,
  X,
} from "lucide-react";
import { Project, User as UserType, Task } from "../../types";
import { apiService } from "../../utils/apiService";

// Chart.js & react-chartjs-2 imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

interface Report {
  id: string;
  title: string;
  description: string;
  type: "project" | "task" | "user" | "financial" | "custom";
  status: "draft" | "published" | "archived";
  project_id?: string | null;
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

interface AnalyticsData {
  budget: number;
  totalCost: number;
  totalRevenue: number;
  monthlyData?: {
    month: string;
    budget: number;
    cost: number;
    revenue: number;
  }[];
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
const ALL_PROJECTS_VALUE = "__all__";

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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "project" as Report["type"],
    status: "draft" as Report["status"],
    project_id: ALL_PROJECTS_VALUE,
  });

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

  // Fetch analytics data when viewing a report
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedReport || !showViewForm) return;

      if (!["financial", "project"].includes(selectedReport.type)) {
        setAnalyticsData(null);
        return;
      }

      setAnalyticsLoading(true);
      try {
        const response = await apiService.getReportAnalytics(selectedReport.id);

        if (response.error) {
          throw new Error(response.error);
        }

        setAnalyticsData(response.data || null);
      } catch (err: any) {
        console.error("Failed to load analytics:", err);
        Swal.fire({
          icon: "error",
          title: "Analytics Error",
          text: err.message || "Could not load report analytics data.",
          customClass: swalCustomClasses,
        });
        setAnalyticsData(null);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedReport, showViewForm]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "project",
      status: "draft",
      project_id: ALL_PROJECTS_VALUE,
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

  // CREATE REPORT
  const handleCreate = async () => {
    const title = formData.title.trim();
    if (!title || isCreating) return;

    if (title.length === 0 || formData.description.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "All fields are required.",
        customClass: swalCustomClasses,
      });
      return;
    }

    if (title.length > 50) {
      Swal.fire({
        icon: "warning",
        title: "Content Exceeds Limit",
        text: "Title cannot exceed 50 characters.",
        customClass: swalCustomClasses,
      });
      return;
    }

    if (formData.description.length > 200) {
      Swal.fire({
        icon: "warning",
        title: "Content Exceeds Limit",
        text: "Description cannot exceed 200 characters.",
        customClass: swalCustomClasses,
      });
      return;
    }

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
        project_id: formData.project_id === ALL_PROJECTS_VALUE ? null : formData.project_id,
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

  // UPDATE REPORT
  const handleUpdate = async () => {
    if (!selectedReport || !formData.title.trim()) return;

    const title = formData.title.trim();
    const description = formData.description.trim();

    if (title.length === 0 || description.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "All fields are required.",
        customClass: swalCustomClasses,
      });
      return;
    }

    if (title.length > 50) {
      Swal.fire({
        icon: "warning",
        title: "Content Exceeds Limit",
        text: "Title cannot exceed 50 characters.",
        customClass: swalCustomClasses,
      });
      return;
    }

    if (description.length > 200) {
      Swal.fire({
        icon: "warning",
        title: "Content Exceeds Limit",
        text: "Description cannot exceed 200 characters.",
        customClass: swalCustomClasses,
      });
      return;
    }

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
        description: formData.description.trim() || selectedReport.description || "",
        type: formData.type,
        status: formData.status,
        project_id: formData.project_id === ALL_PROJECTS_VALUE ? null : formData.project_id,
        created_by: selectedReport.created_by,
        created_at: selectedReport.created_at,
      };

      const response = await apiService.editReport(selectedReport.id, payload);

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

  // DELETE REPORT
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

  // EXPORT REPORT
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

    const selectResult = await Swal.fire({
      title: "Export to supervisor",
      input: "select",
      inputOptions,
      inputPlaceholder: "Select a supervisor",
      showCancelButton: true,
      confirmButtonText: "Export",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value) return "Please select a supervisor";
        return null;
      },
      customClass: swalCustomClasses,
    });

    if (!selectResult.isConfirmed || !selectResult.value) return;

    const loadingSwal = showLoading();
    const startTime = Date.now();

    try {
      const response = await apiService.exportReport(report.id, selectResult.value);
      if (response.error) throw new Error(response.error);

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
      project_id: report.project_id || ALL_PROJECTS_VALUE,
    });
    setShowEditForm(true);
  };

  const handleView = (report: Report) => {
    setSelectedReport(report);
    setShowViewForm(true);
    setAnalyticsData(null);
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

  const getRoleFilteredReports = () => {
    if (currentUser.role === "admin") return reports;
    if (currentUser.role === "supervisor") {
      return reports.filter(
        (r) =>
          r.created_by === currentUser.id ||
          r.status === "published" ||
          (r.project_id &&
            projects.some(
              (p) => p.id === r.project_id && p.supervisorId === currentUser.id
            )) ||
          (r.shared_with && r.shared_with.includes(currentUser.id))
      );
    }
    return reports.filter((r) => r.status === "published");
  };

  const roleFiltered = getRoleFilteredReports();

  const searchedReports = roleFiltered.filter((report) => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();

    const projectName =
      report.project_id
        ? projects.find((p) => p.id === report.project_id)?.name?.toLowerCase() ||
          ""
        : "All Projects";

    const creatorName =
      users.find((u) => u.id === report.created_by)?.name?.toLowerCase() || "";

    return (
      report.title.toLowerCase().includes(term) ||
      (report.description || "").toLowerCase().includes(term) ||
      projectName.includes(term) ||
      creatorName.includes(term) ||
      report.type.toLowerCase().includes(term)
    );
  });

  // Chart Data Preparation
  const getChartData = () => {
    if (!analyticsData) return null;

    const labels = analyticsData.monthlyData?.map((d) => d.month) || [];

    return {
      barData: {
        labels,
        datasets: [
          {
            label: "Budget",
            data: analyticsData.monthlyData?.map((d) => d.budget) || [],
            backgroundColor: "rgba(53, 162, 235, 0.6)",
            borderColor: "rgb(53, 162, 235)",
            borderWidth: 1,
          },
          {
            label: "Cost",
            data: analyticsData.monthlyData?.map((d) => d.cost) || [],
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            borderColor: "rgb(255, 99, 132)",
            borderWidth: 1,
          },
          {
            label: "Revenue",
            data: analyticsData.monthlyData?.map((d) => d.revenue) || [],
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgb(75, 192, 192)",
            borderWidth: 1,
          },
        ],
      },
      summaryData: {
        labels: ["Budget", "Cost", "Revenue"],
        datasets: [
          {
            label: "Financial Summary",
            data: [analyticsData.budget, analyticsData.totalCost, analyticsData.totalRevenue],
            backgroundColor: [
              "rgba(54, 162, 235, 0.7)",
              "rgba(255, 99, 132, 0.7)",
              "rgba(75, 192, 192, 0.7)",
            ],
            borderColor: [
              "rgb(54, 162, 235)",
              "rgb(255, 99, 132)",
              "rgb(75, 192, 192)",
            ],
            borderWidth: 1,
          },
        ],
      },
    };
  };

  const chartData = getChartData();

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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
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
      </div>

      {/* Search bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-4.5 h-4 w-4 -translate-y-1/2 pointer-events-none text-[#e28a33]" />
        <Input
          placeholder="Search reports..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 w-full"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-2 top-4.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <p className="text-sm text-muted-foreground px-2">
          <span className="text-[#e28a33]">Note:</span> Search by report title, description, project name, creator name, or report type
        </p>
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
          <TabsList className="w-full">
            <TabsTrigger value="all">
              <FileText className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">All Reports</span>
            </TabsTrigger>
            <TabsTrigger value="project">
              <Building className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Project</span>
            </TabsTrigger>
            <TabsTrigger value="task">
              <AlertCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Task</span>
            </TabsTrigger>
            <TabsTrigger value="financial">
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Financial</span>
            </TabsTrigger>
          </TabsList>

          {["all", "project", "task", "financial"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchedReports
                  .filter((r) => tabValue === "all" || r.type === tabValue)
                  .map((report) => (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="px-4 pt-4 pb-2">
                        <div className="space-y-3">
                          <div>
                            <CardTitle className="text-lg">{report.title}</CardTitle>
                            {report.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {report.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                            <Badge variant={getTypeColor(report.type)}>
                              {report.type}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <div className="grid gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">
                              {report.project_id
                                ? projects.find((p) => p.id === report.project_id)?.name || "Unknown"
                                : "All Projects"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Created by:{" "}
                              {users.find((u) => u.id === report.created_by)?.name || "Unknown"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Created: {new Date(report.created_at).toLocaleDateString("en-PH")}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(report)}
                              className="w-full"
                            >
                              <Eye className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExport(report)}
                              className="w-full"
                            >
                              <Download className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Export</span>
                            </Button>
                          </div>
                          {canEditReport(report) && (
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(report)}
                                className="w-full"
                              >
                                <Edit className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(report)}
                                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {searchedReports.filter((r) => tabValue === "all" || r.type === tabValue).length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <p>No {tabValue === "all" ? "" : tabValue} reports found.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {searchedReports.length === 0 && !loading && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto max-w-md">
              {searchTerm.trim() ? (
                <>
                  <Search className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No matching reports found</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    No reports match your search "{searchTerm}"
                  </p>
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CREATE FORM */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="modal bg-background border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="max-h-[90vh] overflow-auto">
              <div className="border-b p-5 sticky top-0 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Create New Report</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                    ×
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate a comprehensive report with customizable filters and data.
                </p>
              </div>

              <div className="space-y-6 p-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter report title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter report description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v as Report["type"] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project Report</SelectItem>
                        <SelectItem value="task">Task Report</SelectItem>
                        <SelectItem value="user">User Report</SelectItem>
                        <SelectItem value="financial">Financial Report</SelectItem>
                        <SelectItem value="custom">Custom Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData({ ...formData, status: v as Report["status"] })
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

                {(formData.type === "project" || formData.type === "financial") && (
                  <div className="space-y-2">
                    <Label>Associated Project</Label>
                    <Select
                      value={formData.project_id}
                      onValueChange={(v) => setFormData({ ...formData, project_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project or All Projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_PROJECTS_VALUE}>All Projects</SelectItem>
                        {projects
                          .filter(
                            (p) =>
                              currentUser.role === "admin" || p.supervisorId === currentUser.id
                          )
                          .map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select "All Projects" to aggregate data across all accessible projects
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8 p-5">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
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

      {/* EDIT FORM */}
      {showEditForm && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="modal bg-background border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="max-h-[90vh] overflow-auto">
              <div className="p-5 border-b bg-white sticky top-0">
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
                <p className="text-sm text-muted-foreground">
                  Update report details and regenerate data.
                </p>
              </div>

              <div className="space-y-6 p-5">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Report Title</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter report title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter report description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v as Report["type"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="project">Project Report</SelectItem>
                        <SelectItem value="task">Task Report</SelectItem>
                        <SelectItem value="user">User Report</SelectItem>
                        <SelectItem value="financial">Financial Report</SelectItem>
                        <SelectItem value="custom">Custom Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData({ ...formData, status: v as Report["status"] })
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

                {(formData.type === "project" || formData.type === "financial") && (
                  <div className="space-y-2">
                    <Label>Associated Project</Label>
                    <Select
                      value={formData.project_id}
                      onValueChange={(v) => setFormData({ ...formData, project_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project or All Projects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_PROJECTS_VALUE}>All Projects</SelectItem>
                        {projects
                          .filter(
                            (p) =>
                              currentUser.role === "admin" || p.supervisorId === currentUser.id
                          )
                          .map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select "All Projects" to aggregate data across all accessible projects
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8 p-5">
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
                <Button onClick={handleUpdate} disabled={!formData.title.trim()}>
                  Update Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW FORM - WITH REAL ANALYTICS CHARTS */}
      {showViewForm && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="modal bg-background border rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
            <div className="">
              <div className="flex items-center justify-between mb-6 border-b bg-white p-5 sticky top-0">
                <div>
                  <h2 className="text-2xl font-bold">{selectedReport.title}</h2>
                  {selectedReport.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedReport.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowViewForm(false);
                    setSelectedReport(null);
                    setAnalyticsData(null);
                  }}
                >
                  ×
                </Button>
              </div>

              {/* Report Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8 text-sm p-5">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium mt-1 capitalize">{selectedReport.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium mt-1 capitalize">{selectedReport.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium mt-1">
                    {new Date(selectedReport.created_at).toLocaleString("en-PH")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium mt-1">
                    {new Date(selectedReport.updated_at).toLocaleString("en-PH")}
                  </p>
                </div>
              </div>

              {/* Analytics Section */}
              {["financial", "project"].includes(selectedReport.type) ? (
                analyticsLoading ? (
                  <div className="flex justify-center items-center h-64 ">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : analyticsData ? (
                  <div className="space-y-10 p-5">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Total Budget</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold text-blue-600 p-5">
                            ₱{analyticsData.budget.toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Total Cost</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold text-red-600 p-5">
                            ₱{analyticsData.totalCost.toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold text-green-600 p-5">
                            ₱{analyticsData.totalRevenue.toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Monthly Bar Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Monthly Budget vs Cost vs Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-80">
                            <Bar
                              data={chartData!.barData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: "top" },
                                  title: { display: false },
                                },
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    ticks: {
                                      callback: (value) => `₱${Number(value).toLocaleString()}`,
                                    },
                                  },
                                },
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Doughnut Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Financial Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                          <div className="h-80 w-80">
                            <Doughnut
                              data={chartData!.summaryData}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: { position: "bottom" },
                                },
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground p-5">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">No financial data available</p>
                    <p className="mt-2">
                      This report doesn't have budget/cost/revenue information yet.
                    </p>
                  </div>
                )
              ) : (
                <div className="border rounded-lg p-12 bg-muted/40 min-h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-6 opacity-70" />
                    <p className="text-xl font-medium mb-3">Report Content Area</p>
                    <p>Detailed report content, tables, and analytics will appear here</p>
                    <p className="text-sm mt-4 opacity-70">
                      (Only financial & project reports show charts at the moment)
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-10 p-5">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewForm(false);
                    setSelectedReport(null);
                    setAnalyticsData(null);
                  }}
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