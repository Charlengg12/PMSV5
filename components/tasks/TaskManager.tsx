import { useState } from "react";
import Swal from "sweetalert2";
import { apiService } from "../../utils/apiService";
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
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  User,
  Building,
  CheckCircle,
  SquareCheckBig,
  Search,
  X,
} from "lucide-react";
import { Task, Project, User as UserType } from "../../types";

interface TaskManagerProps {
  tasks: Task[];
  projects: Project[];
  users: UserType[];
  currentUser: UserType;
  onCreateTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
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

const MIN_LOADING_TIME = 2000; // 2 seconds

export function TaskManager({
  tasks,
  projects,
  users,
  currentUser,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: TaskManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createAttempted, setCreateAttempted] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending" as Task["status"],
    priority: "medium" as Task["priority"],
    projectId: "",
    assignedTo: "unassigned",
    dueDate: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      projectId: "",
      assignedTo: "unassigned",
      dueDate: "",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setSelectedTask(null);
    setCreateAttempted(false);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
    setCreateAttempted(false);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedTask(null);
    resetForm();
  };

  // Helper to enforce minimum loading time
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const normalizeDateValue = (value: string) => {
    if (!value) return "";
    const [year = "", month = "", day = ""] = value.split("-");
    const safeYear = year.replace(/\D/g, "").slice(0, 4);
    const safeMonth = month.replace(/\D/g, "").slice(0, 2);
    const safeDay = day.replace(/\D/g, "").slice(0, 2);
    const normalizedMonth = safeMonth.length === 1 ? `0${safeMonth}` : safeMonth;
    const normalizedDay = safeDay.length === 1 ? `0${safeDay}` : safeDay;
    return `${safeYear}-${normalizedMonth}-${normalizedDay}`;
  };

  const isValidDateValue = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    const d = new Date(year, month - 1, day);
    return (
      d.getFullYear() === year &&
      d.getMonth() === month - 1 &&
      d.getDate() === day
    );
  };

  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isOnOrAfterToday = (value: string) => {
    if (!isValidDateValue(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const inputDate = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return inputDate >= today;
  };

  const getMissingFields = () => {
    const missing: string[] = [];
    if (!formData.title.trim()) missing.push("Task Title");
    if (!formData.description.trim()) missing.push("Description");
    if (!formData.status) missing.push("Status");
    if (!formData.priority) missing.push("Priority");
    if (!formData.projectId) missing.push("Project");
    if (!formData.assignedTo || formData.assignedTo === "unassigned") {
      missing.push("Assign To");
    }
    if (!isOnOrAfterToday(formData.dueDate)) missing.push("Due Date");
    return missing;
  };

  const editMissingFields = showEditModal ? getMissingFields() : [];
  const createMissingFields =
    showCreateModal && createAttempted ? getMissingFields() : [];
  const todayDate = getTodayDateString();
  const editDueDateError = showEditModal
    ? !formData.dueDate
      ? "Due Date Required"
      : !isValidDateValue(formData.dueDate)
        ? "Due Date Invalid"
        : !isOnOrAfterToday(formData.dueDate)
          ? "Due Date must be today or later"
          : ""
    : "";
  const createDueDateError = showCreateModal && createAttempted
    ? !formData.dueDate
      ? "Due Date Required"
      : !isValidDateValue(formData.dueDate)
        ? "Due Date Invalid"
        : !isOnOrAfterToday(formData.dueDate)
          ? "Due Date must be today or later"
          : ""
    : "";
  const isEditComplete = editMissingFields.length === 0;
  const isCreateComplete = createMissingFields.length === 0;
  const isEditMissing = (field: string) => editMissingFields.includes(field);
  const isCreateMissing = (field: string) => createMissingFields.includes(field);

  // ─── Role-based filtering ──────────────────────────────────────
  const getFilteredTasksByRole = () => {
    if (currentUser.role === "admin") return tasks;
    if (currentUser.role === "supervisor") {
      const supervisorProjects = projects.filter(
        (p) => p.supervisorId === currentUser.id
      );
      return tasks.filter((t) =>
        supervisorProjects.some((p) => p.id === t.projectId)
      );
    }
    // fabricator or other roles
    return tasks.filter(
      (t) => t.assignedTo === currentUser.id || t.createdBy === currentUser.id
    );
  };

  const roleFilteredTasks = getFilteredTasksByRole();

  // ─── Client-side search ────────────────────────────────────────
  const searchedTasks = roleFilteredTasks.filter((task) => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();

    const projectName =
      projects.find((p) => p.id === task.projectId)?.name?.toLowerCase() || "";

    const assignedName =
      users.find((u) => u.id === task.assignedTo)?.name?.toLowerCase() || "";

    const creatorName =
      users.find((u) => u.id === task.createdBy)?.name?.toLowerCase() || "";

    return (
      task.title.toLowerCase().includes(term) ||
      (task.description || "").toLowerCase().includes(term) ||
      projectName.includes(term) ||
      assignedName.includes(term) ||
      creatorName.includes(term)
    );
  });

  const canCreateTask =
    currentUser.role === "admin" || currentUser.role === "supervisor";

  const canEditTask = (task: Task) =>
    currentUser.role === "admin" ||
    task.createdBy === currentUser.id ||
    (currentUser.role === "supervisor" &&
      projects.some(
        (p) => p.id === task.projectId && p.supervisorId === currentUser.id
      ));

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "pending":
        return "outline";
      case "blocked":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority: Task["priority"]) => {
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

  // ─── CREATE TASK ───────────────────────────────────────────────
  const handleCreate = async () => {
    setCreateAttempted(true);
    const missingFields = getMissingFields();
    if (missingFields.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: `All fields are required. Missing: ${missingFields.join(", ")}.`,
        customClass: swalCustomClasses,
      });
      return;
    }

    // if title is > 50 chars return exceeding limit
    if (formData.title.trim().length > 50) {
      Swal.fire({
        icon: "warning",
        title: "Title Exceeds Limit",
        text: "Title cannot exceed 50 characters.",
        customClass: swalCustomClasses,
      });
      return;
    }

    // if description is > 200 chars return exceeding limit
    if (formData.description.trim().length > 200) {
      Swal.fire({
        icon: "warning",
        title: "Description Exceeds Limit",
        text: "Description cannot exceed 200 characters.",
        customClass: swalCustomClasses,
      });
      return;
    }

    const confirmed = await Swal.fire({
      title: "Create Task?",
      text: "Are you sure you want to create this task?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Create",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!confirmed.isConfirmed) return;

    const loadingSwal = Swal.fire({
      title: "Creating...",
      text: "Please wait while we save the task.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    const startTime = Date.now();

    try {
      const { data, error } = await apiService.createTask({
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        projectId: formData.projectId,
        assignedTo: formData.assignedTo,
        dueDate: formData.dueDate,
        createdBy: currentUser.id,
      });

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }

      loadingSwal.close();

      if (data && !error) {
        onCreateTask({
          title: formData.title.trim(),
          description: formData.description.trim(),
          status: formData.status,
          priority: formData.priority,
          projectId: formData.projectId,
          assignedTo: formData.assignedTo,
          dueDate: formData.dueDate,
          createdBy: currentUser.id,
        });
        Swal.fire({
          icon: "success",
          title: "Task Created!",
          text: "The task has been successfully added.",
          timer: 1800,
          showConfirmButton: false,
          customClass: swalCustomClasses,
        });
        closeCreateModal();
      } else {
        Swal.fire({
          icon: "error",
          title: "Creation Failed",
          text: error || "Could not save task to database.",
          customClass: swalCustomClasses,
        });
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }
      loadingSwal.close();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while creating the task.",
        customClass: swalCustomClasses,
      });
    }
  };

  // ─── UPDATE TASK ───────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!selectedTask) return;
    const missingFields = getMissingFields();
    if (missingFields.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete",
        text: `All fields should be filled. Missing: ${missingFields.join(", ")}.`,
        customClass: swalCustomClasses,
      });
      return;
    }

    const confirmed = await Swal.fire({
      title: "Update Task?",
      text: "Save changes to this task?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!confirmed.isConfirmed) return;

    const loadingSwal = Swal.fire({
      title: "Updating...",
      text: "Saving your changes...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    const startTime = Date.now();

    try {
      const { data, error } = await apiService.updateTask(selectedTask.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        projectId: formData.projectId,
        assignedTo: formData.assignedTo,
        dueDate: formData.dueDate,
      });

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }

      loadingSwal.close();

      if (data && !error) {
        onUpdateTask(selectedTask.id, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          status: formData.status,
          priority: formData.priority,
          projectId: formData.projectId,
          assignedTo: formData.assignedTo,
          dueDate: formData.dueDate,
        });
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Task has been successfully updated.",
          timer: 1500,
          showConfirmButton: false,
          customClass: swalCustomClasses,
        });
        closeEditModal();
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: error || "Could not update task.",
          customClass: swalCustomClasses,
        });
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }
      loadingSwal.close();
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Failed to reach the server.",
        customClass: swalCustomClasses,
      });
    }
  };

  // ─── MARK AS DONE ──────────────────────────────────────────────
  const handleMarkAsDone = async (task: Task) => {
    const confirmed = await Swal.fire({
      title: "Mark as Done?",
      text: `Confirm completion of "${task.title}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Complete",
      cancelButtonText: "Cancel",
      customClass: swalCustomClasses,
    });

    if (!confirmed.isConfirmed) return;

    const loadingSwal = Swal.fire({
      title: "Updating...",
      text: "Marking task as completed...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    const startTime = Date.now();

    try {
      const { data, error } = await apiService.updateTask(task.id, {
        status: "completed",
      });

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }

      loadingSwal.close();

      if (data && !error) {
        onUpdateTask(task.id, data);
        Swal.fire({
          icon: "success",
          title: "Completed!",
          text: "Task marked as done.",
          timer: 1400,
          showConfirmButton: false,
          customClass: swalCustomClasses,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: error || "Could not update status.",
          customClass: swalCustomClasses,
        });
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }
      loadingSwal.close();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to connect to server.",
        customClass: swalCustomClasses,
      });
    }
  };

  // ─── DELETE TASK ───────────────────────────────────────────────
  const confirmDelete = async (task: Task) => {
    const result = await Swal.fire({
      title: "Delete Task?",
      text: `Are you sure you want to delete "${task.title}"?\nThis cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        ...swalCustomClasses,
        confirmButton: "swal-confirm-button swal-delete-confirm",
      },
    });

    if (!result.isConfirmed) return;

    const loadingSwal = Swal.fire({
      title: "Deleting...",
      text: "Removing task...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
      customClass: swalCustomClasses,
    });

    const startTime = Date.now();

    try {
      await apiService.deleteTask(task.id);
      onDeleteTask(task.id);

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }

      loadingSwal.close();

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Task has been removed.",
        timer: 1400,
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
        title: "Delete Failed",
        text: "Could not delete the task.",
        customClass: swalCustomClasses,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl font-bold">
            <SquareCheckBig className="inline-block mr-2 mb-1 text-blue-700" />
            Task Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Create, manage, and track project tasks
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {canCreateTask && (
            <Button
              onClick={openCreateModal}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* Search Input */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-4.5 h-4 w-4 -translate-y-1/2 pointer-events-none text-[#e28a33]" />
            <Input
              placeholder="Search task..."
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
            <p className="text-sm text-muted-foreground px-2"><span className="text-[#e28a33]">Note: </span>Search by title, description, project, assigned to or status</p>
          </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {searchedTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight">
                    {task.title}
                  </CardTitle>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Badge variant={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                  <Badge variant={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="text-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>
                  Project:{" "}
                  {projects.find((p) => p.id === task.projectId)?.name || "—"}
                </span>
              </div>

              {task.assignedTo && task.assignedTo !== "unassigned" && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Assigned:{" "}
                    {users.find((u) => u.id === task.assignedTo)?.name || "—"}
                  </span>
                </div>
              )}

              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <span>
                  By: {users.find((u) => u.id === task.createdBy)?.name || "—"}
                </span>
                <span>•</span>
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>

              {canEditTask(task) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTask(task);
                      setFormData({
                        title: task.title,
                        description: task.description || "",
                        status: task.status,
                        priority: task.priority,
                        projectId: task.projectId,
                        assignedTo: task.assignedTo || "unassigned",
                        dueDate: task.dueDate || "",
                      });
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                    onClick={() => confirmDelete(task)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>

                  {task.status !== "completed" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleMarkAsDone(task)}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Done
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {searchedTasks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">
              {searchTerm.trim() ? "No matching tasks found" : "No tasks found"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm.trim()
                ? "Try different search terms or clear the search"
                : canCreateTask
                ? "Create your first task to get started."
                : "No tasks assigned to you yet."}
            </p>
            {searchTerm.trim() && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            )}
            {!searchTerm.trim() && canCreateTask && (
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="modal bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border">
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">Create New Task</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fill in the task details below
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={closeCreateModal}>
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-title">Task Title *</Label>
                  <Input
                    id="create-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter task title"
                  />
                  {isCreateMissing("Task Title") && (
                    <p className="text-xs text-destructive">Task Title Required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Task details / notes..."
                    rows={3}
                  />
                  {isCreateMissing("Description") && (
                    <p className="text-xs text-destructive">Description Required</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: Task["status"]) =>
                        setFormData({ ...formData, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isCreateMissing("Status")
                              ? "Status Required"
                              : "Select status"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    {isCreateMissing("Status") && (
                      <p className="text-xs text-destructive">Status Required</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Priority *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v: Task["priority"]) =>
                        setFormData({ ...formData, priority: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isCreateMissing("Priority")
                              ? "Priority Required"
                              : "Select priority"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    {isCreateMissing("Priority") && (
                      <p className="text-xs text-destructive">Priority Required</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, projectId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects
                        .filter(
                          (p) =>
                            currentUser.role === "admin" ||
                            p.supervisorId === currentUser.id
                        )
                        .map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {isCreateMissing("Project") && (
                    <p className="text-xs text-destructive">Project Required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Assign To *</Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        assignedTo: v === "unassigned" ? "unassigned" : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users
                        .filter(
                          (u) =>
                            u.role === "fabricator" || u.role === "supervisor"
                        )
                        .map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.secureId})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {isCreateMissing("Assign To") && (
                    <p className="text-xs text-destructive">Assign To Required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    min={todayDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dueDate: normalizeDateValue(e.target.value),
                      })
                    }
                  />
                  {createDueDateError && (
                    <p className="text-xs text-destructive">
                      {createDueDateError}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t">
                <Button variant="outline" onClick={closeCreateModal}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!isCreateComplete}>
                  Create Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="modal bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border">
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">Edit Task</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Update task information
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={closeEditModal}>
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Task Title *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                  {isEditMissing("Task Title") && (
                    <p className="text-xs text-destructive">Task Title Required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                  {isEditMissing("Description") && (
                    <p className="text-xs text-destructive">Description Required</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: Task["status"]) =>
                        setFormData({ ...formData, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isEditMissing("Status")
                              ? "Status Required"
                              : "Select status"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                    {isEditMissing("Status") && (
                      <p className="text-xs text-destructive">Status Required</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Priority *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v: Task["priority"]) =>
                        setFormData({ ...formData, priority: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isEditMissing("Priority")
                              ? "Priority Required"
                              : "Select priority"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    {isEditMissing("Priority") && (
                      <p className="text-xs text-destructive">Priority Required</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, projectId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isEditMissing("Project")
                            ? "Project Required"
                            : "Select project"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {projects
                        .filter(
                          (p) =>
                            currentUser.role === "admin" ||
                            p.supervisorId === currentUser.id
                        )
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {isEditMissing("Project") && (
                    <p className="text-xs text-destructive">Project Required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Assign To *</Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        assignedTo: v === "unassigned" ? "unassigned" : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isEditMissing("Assign To")
                            ? "Assign To Required"
                            : "Select team member"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users
                        .filter(
                          (u) =>
                            u.role === "fabricator" || u.role === "supervisor"
                        )
                        .map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.secureId})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {isEditMissing("Assign To") && (
                    <p className="text-xs text-destructive">Assign To Required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Due Date *</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    min={todayDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dueDate: normalizeDateValue(e.target.value),
                      })
                    }
                  />
                  {editDueDateError && (
                    <p className="text-xs text-destructive">{editDueDateError}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t">
                <Button variant="outline" onClick={closeEditModal}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={!isEditComplete}>
                  Update Task
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}