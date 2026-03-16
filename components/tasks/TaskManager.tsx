import React, { useState } from "react";
import Swal from "sweetalert2";
import { apiService } from "../../utils/apiService";
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
  Layers3,
  MinusCircle,
  CircleDot,
  ArrowUpCircle,
  Siren,
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

const MIN_LOADING_TIME = 2000;

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

  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending" as Task["status"],
    priority: "medium" as Task["priority"],
    projectId: "",
    assignedTo: [] as string[],
    dueDate: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      projectId: "",
      assignedTo: [],
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
    if (!Array.isArray(formData.assignedTo) || formData.assignedTo.length === 0) {
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
    return tasks.filter(
      (t) =>
        Array.isArray(t.assignedTo)
          ? t.assignedTo.includes(currentUser.id)
          : t.createdBy === currentUser.id
    );
  };

  const roleFilteredTasks = getFilteredTasksByRole();
  const totalTasksCount = roleFilteredTasks.length;
  const totalLowPriorityCount = roleFilteredTasks.filter(
    (task) => task.priority === "low",
  ).length;
  const totalMediumPriorityCount = roleFilteredTasks.filter(
    (task) => task.priority === "medium",
  ).length;
  const totalHighPriorityCount = roleFilteredTasks.filter(
    (task) => task.priority === "high",
  ).length;
  const totalUrgentPriorityCount = roleFilteredTasks.filter(
    (task) => task.priority === "urgent",
  ).length;

  const searchedTasks = roleFilteredTasks.filter((task) => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();

    const projectName =
      projects.find((p) => p.id === task.projectId)?.name?.toLowerCase() || "";

    const assignedName = users
      .filter((u) => task.assignedTo?.includes(u.id))
      .map((u) => u.name.toLowerCase())
      .join(" ");

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

    if (formData.title.trim().length > 50) {
      Swal.fire({
        icon: "warning",
        title: "Title Exceeds Limit",
        text: "Title cannot exceed 50 characters.",
        customClass: swalCustomClasses,
      });
      return;
    }

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

    if (formData.title.trim().length > 50) {
      Swal.fire({
        icon: "warning",
        title: "Title Exceeds Limit",
        text: "Title cannot exceed 50 characters.",
        customClass: swalCustomClasses,
      });
      return;
    }

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
      <div className="z-10 bg-background border-b pb-4 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-left">
            <div className="flex items-center gap-3">
              <SquareCheckBig className="h-6 w-6 text-orange-400" />
              <h1 className="text-3xl font-bold tracking-tight">
                Task Management
              </h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Create, manage, and track project tasks
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {canCreateTask && (
              <Button onClick={openCreateModal} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 mt-5">
          <div className="overflow-hidden rounded-[1.5rem] border border-[#e8ebf0] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  All Tasks
                </p>
                <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {totalTasksCount}
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Total tasks in your current view
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300">
                <Layers3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[#e8ebf0] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Low
                </p>
                <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {totalLowPriorityCount}
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Lower urgency work items
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <MinusCircle className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[#e8ebf0] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Medium
                </p>
                <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {totalMediumPriorityCount}
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Balanced day-to-day tasks
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300">
                <CircleDot className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[#e8ebf0] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  High
                </p>
                <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {totalHighPriorityCount}
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Important tasks needing focus
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-orange-600 dark:border-orange-900/60 dark:bg-orange-950/50 dark:text-orange-300">
                <ArrowUpCircle className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[#e8ebf0] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Urgent
                </p>
                <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {totalUrgentPriorityCount}
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Highest priority tasks right now
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300">
                <Siren className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-[#e28a33]" />
            <Input
              placeholder="Search task..."
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-2 w-full"
            />
            
          </div>
          <p className="text-sm text-muted-foreground mt-1 px-2">
            <span className="text-[#e28a33]">Note: </span>
            Search by title, description, project, assigned to or status
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {searchedTasks.map((task) => (
          <div
            key={task.id}
            className="rounded-[2rem] border border-[#e8ebf0] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.1)] dark:border-slate-700 dark:bg-slate-900 sm:p-6"
          >
            <div className="mb-5 flex flex-col gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold leading-tight text-slate-900 dark:text-slate-100">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {task.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant={getStatusColor(task.status)}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase"
                >
                  {task.status}
                </Badge>
                <Badge
                  variant={getPriorityColor(task.priority)}
                  className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase"
                >
                  {task.priority}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-[1.25rem] border border-[#eef2f6] bg-[#fafbfc] px-4 py-3 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <Building className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                <span>
                  Project:{" "}
                  {projects.find((p) => p.id === task.projectId)?.name || "—"}
                </span>
              </div>

              {task.assignedTo && task.assignedTo !== ["unassigned"] && (
                <div className="flex items-center gap-3 rounded-[1.25rem] border border-[#eef2f6] bg-[#fafbfc] px-4 py-3 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span>
                    Assigned:{" "}
                    {users
                      .filter((u) => task.assignedTo?.includes(u.id))
                      .map((u) => u.name)
                      .join(", ") || "—"}
                  </span>
                </div>
              )}

              {task.dueDate && (
                <div className="flex items-center gap-3 rounded-[1.25rem] border border-[#eef2f6] bg-[#fafbfc] px-4 py-3 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <span>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 px-1 pt-1 text-xs text-slate-400 dark:text-slate-500">
                <span>
                  By: {users.find((u) => u.id === task.createdBy)?.name || "—"}
                </span>
                <span>•</span>
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>

              {canEditTask(task) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl border-[#e8ebf0] bg-white shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    onClick={() => {
                      setSelectedTask(task);
                      setFormData({
                        title: task.title,
                        description: task.description || "",
                        status: task.status,
                        priority: task.priority,
                        projectId: task.projectId,
                        assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : [],
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
                    className="rounded-2xl border-destructive/30 text-destructive hover:border-destructive/60 hover:bg-red-50 hover:text-destructive dark:hover:bg-red-950/30"
                    onClick={() => confirmDelete(task)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>

                  {task.status !== "completed" && (
                    <Button
                      size="sm"
                      className="rounded-2xl bg-green-600 text-white hover:bg-green-700"
                      onClick={() => handleMarkAsDone(task)}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                      Done
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {searchedTasks.length === 0 && (
        <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
          <div className="py-12 text-center">
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
          </div>
        </div>
      )}

      {/* ── Create Modal ────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="modal w-full max-w-lg max-h-[90vh] bg-background rounded-lg shadow-xl overflow-hidden flex flex-col border">
            {/* Fixed Header */}
            <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Task
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill in the task details below
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={closeCreateModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                    rows={4}
                  />
                  {isCreateMissing("Description") && (
                    <p className="text-xs text-destructive">Description Required</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: Task["status"]) =>
                        setFormData({ ...formData, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
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
                        <SelectValue placeholder="Select priority" />
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
                  <div className="border rounded-md p-4 space-y-3 max-h-48 overflow-y-auto">
                    {users
                      .filter(
                        (u) =>
                          u.role === "fabricator" || u.role === "supervisor"
                      )
                      .map((user) => {
                        const checked = formData.assignedTo.includes(user.id);
                        return (
                          <label
                            key={user.id}
                            className="flex items-center gap-3 cursor-pointer text-sm hover:bg-accent/50 p-1 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  assignedTo: checked
                                    ? prev.assignedTo.filter((id) => id !== user.id)
                                    : [...prev.assignedTo, user.id],
                                }));
                              }}
                              className="h-4 w-4"
                            />
                            <div>
                              <span className="font-medium">{user.name}</span>
                              <span className="text-muted-foreground text-xs ml-2">
                                ({user.secureId})
                              </span>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                  {isCreateMissing("Assign To") && (
                    <p className="text-xs text-destructive">
                      At least one assignee required
                    </p>
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
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!isCreateComplete}>
                Create Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────────── */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="modal w-full max-w-lg max-h-[90vh] bg-background rounded-lg shadow-xl overflow-hidden flex flex-col border">
            {/* Fixed Header */}
            <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Task
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Update task information
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={closeEditModal}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                    rows={4}
                  />
                  {isEditMissing("Description") && (
                    <p className="text-xs text-destructive">Description Required</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: Task["status"]) =>
                        setFormData({ ...formData, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
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
                        <SelectValue placeholder="Select priority" />
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
                      <SelectValue placeholder="Select project" />
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
                  <div className="border rounded-md p-4 space-y-3 max-h-48 overflow-y-auto">
                    {users
                      .filter(
                        (u) =>
                          u.role === "fabricator" || u.role === "supervisor"
                      )
                      .map((user) => {
                        const checked = formData.assignedTo.includes(user.id);
                        return (
                          <label
                            key={user.id}
                            className="flex items-center gap-3 cursor-pointer text-sm hover:bg-accent/50 p-1 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  assignedTo: checked
                                    ? prev.assignedTo.filter((id) => id !== user.id)
                                    : [...prev.assignedTo, user.id],
                                }));
                              }}
                              className="h-4 w-4"
                            />
                            <div>
                              <span className="font-medium">{user.name}</span>
                              <span className="text-muted-foreground text-xs ml-2">
                                ({user.secureId})
                              </span>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                  {isEditMissing("Assign To") && (
                    <p className="text-xs text-destructive">
                      At least one assignee required
                    </p>
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
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!isEditComplete}>
                Update Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
