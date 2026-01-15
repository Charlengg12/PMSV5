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
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    resetForm();
    setShowCreateModal(false);
  };

  // Helper to enforce minimum loading time
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // ────────────────────────────────────────────────
  // CREATE TASK
  // ────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.projectId) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete",
        text: "Title and Project are required.",
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
        description: formData.description.trim() || undefined,
        status: formData.status,
        priority: formData.priority,
        projectId: formData.projectId,
        assignedTo:
          formData.assignedTo === "unassigned"
            ? undefined
            : formData.assignedTo,
        dueDate: formData.dueDate || undefined,
        createdBy: currentUser.id,
      });

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }

      loadingSwal.close();

      if (data && !error) {
        onCreateTask({ ...data });
        Swal.fire({
          icon: "success",
          title: "Task Created!",
          text: "The task has been successfully added.",
          timer: 1800,
          showConfirmButton: false,
          customClass: swalCustomClasses,
        });
        resetForm();
        setShowCreateModal(false);
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

  // ────────────────────────────────────────────────
  // UPDATE TASK
  // ────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!selectedTask) return;
    if (!formData.title.trim() || !formData.projectId) {
      Swal.fire({
        icon: "warning",
        title: "Required Fields",
        text: "Title and Project are required.",
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
        description: formData.description.trim() || undefined,
        status: formData.status,
        priority: formData.priority,
        projectId: formData.projectId,
        assignedTo:
          formData.assignedTo === "unassigned" ? "" : formData.assignedTo,
        dueDate: formData.dueDate || undefined,
      });

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await delay(MIN_LOADING_TIME - elapsed);
      }

      loadingSwal.close();

      if (data && !error) {
        onUpdateTask(selectedTask.id, data);
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Task has been successfully updated.",
          timer: 1500,
          showConfirmButton: false,
          customClass: swalCustomClasses,
        });
        resetForm();
        setSelectedTask(null);
        setShowEditModal(false);
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

  // ────────────────────────────────────────────────
  // MARK AS DONE
  // ────────────────────────────────────────────────
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

  // ────────────────────────────────────────────────
  // DELETE
  // ────────────────────────────────────────────────
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

  // ────────────────────────────────────────────────
  // Helper functions (unchanged)
  // ────────────────────────────────────────────────
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

  const getFilteredTasks = () => {
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
      (t) => t.assignedTo === currentUser.id || t.createdBy === currentUser.id
    );
  };

  const filteredTasks = getFilteredTasks();
  const canCreateTask =
    currentUser.role === "admin" || currentUser.role === "supervisor";

  const canEditTask = (task: Task) =>
    currentUser.role === "admin" ||
    task.createdBy === currentUser.id ||
    (currentUser.role === "supervisor" &&
      projects.some(
        (p) => p.id === task.projectId && p.supervisorId === currentUser.id
      ));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <h2 className="text-xl sm:text-2xl font-bold">Task Management</h2>
          <p className="text-sm text-muted-foreground">
            Create, manage, and track project tasks
          </p>
        </div>
        {canCreateTask && (
          <div className="flex justify-center sm:justify-end">
            <Button
              onClick={openCreateModal}
              className="w-full sm:w-auto text-base sm:text-sm px-4 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.map((task) => (
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

              {task.assignedTo && (
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

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">No tasks found</h3>
            <p className="text-muted-foreground mb-6">
              {canCreateTask
                ? "Create your first task to get started."
                : "No tasks assigned to you yet."}
            </p>
            {canCreateTask && (
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
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border">
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
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Task details / notes..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: Task["status"]) =>
                        setFormData({ ...formData, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v: Task["priority"]) =>
                        setFormData({ ...formData, priority: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                </div>

                <div className="space-y-2">
                  <Label>Assign To</Label>
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
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t">
                <Button variant="outline" onClick={closeCreateModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!formData.title.trim() || !formData.projectId}
                >
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
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border">
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">Edit Task</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Update task information
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEditModal(false)}
                >
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
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: Task["status"]) =>
                        setFormData({ ...formData, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v: Task["priority"]) =>
                        setFormData({ ...formData, priority: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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

                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(v) =>
                      setFormData({ ...formData, projectId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                </div>

                <div className="space-y-2">
                  <Label>Assign To</Label>
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
                      <SelectValue />
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
                </div>

                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={!formData.title.trim() || !formData.projectId}
                >
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
