import { useState, useEffect } from "react";
import { LoginForm } from "./components/auth/LoginForm";
import { FabricatorSignupForm } from "./components/auth/FabricatorSignupForm";
import { ForgotPasswordForm } from "./components/auth/ForgotPasswordForm";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardStats } from "./components/dashboard/DashboardStats";
import { ProjectOverview } from "./components/dashboard/ProjectOverview";
import { TaskList } from "./components/dashboard/TaskList";
import { ProjectsGrid } from "./components/projects/ProjectsGrid";
// import { ProjectAssignments } from './components/projects/ProjectAssignments';
import { UserManagement } from "./components/users/UserManagement";
import { RevenueOverview } from "./components/revenue/RevenueOverview";
import { WorkLogManager } from "./components/worklog/WorkLogManager";
import { MaterialsManager } from "./components/materials/MaterialsManager";
import { TaskManager } from "./components/tasks/TaskManager";
import { ReportsManager } from "./components/reports/ReportsManager";
import { ProjectArchives } from "./components/archives/ProjectArchives";
import { ClientDashboard } from "./components/client/ClientDashboard";
import { ClientProjectStatus } from "./components/client/ClientProjectStatus";
import { ClientDocumentation } from "./components/client/ClientDocumentation";
import { AdminSettingsPage } from "./components/settings/AdminSettingsPage";
import { ActivityLogs } from "./components/logs/ActivityLogs";
import { TeamOverview } from "./components/team/TeamOverview";
import { ClientBilling } from "./components/revenue/ClientBilling";
// import { AdminProjectsManager } from './components/admin/AdminProjectsManager';
// import { AdminTasksManager } from './components/admin/AdminTasksManager';
import {
  User,
  Task,
  Project,
  WorkLogEntry,
  Material,
  ProjectAssignment,
  ProjectFeedback,
} from "./types";
import {
  mockUsers,
  mockProjects,
  mockTasks,
  mockCompanyRevenue,
  mockWorkLogs,
  mockMaterials,
} from "./data/mockData";
import { mapProjectsFromBackend } from "./utils/projectDataMapper";
import { mapTasksFromBackend } from "./utils/taskDataMapper";
import { mapUserDataFromBackend } from "./utils/userDataMapper";
import { mapMaterialFromBackend, mapMaterialsFromBackend } from "./utils/materialDataMapper";
import { mapWorkLogFromBackend, mapWorkLogsFromBackend } from "./utils/workLogDataMapper";
import { emailService } from "./utils/emailService";
import { apiService } from "./utils/apiService";
import { useTimeBasedTheme } from "./hooks/useTimeBasedTheme";

type ViewType =
  | "dashboard"
  | "projects"
  | "tasks"
  | "users"
  | "materials"
  | "reports"
  | "settings"
  | "team"
  | "worklog"
  | "revenue"
  | "assignments"
  | "archives"
  | "project-status"
  | "documentation"
  | "admin-projects"
  | "admin-tasks"
  | "billing"
  |"activity-logs";
type AuthView = "main" | "fabricator-signup" | "forgot-password";

const FEEDBACK_STORAGE_KEY = "ehub_project_feedback_entries";

const readPersistedFeedback = (): Record<string, ProjectFeedback[]> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const persistFeedbackForProject = (
  projectId: string,
  entries: ProjectFeedback[],
) => {
  if (typeof window === "undefined") return;
  const current = readPersistedFeedback();
  if (entries.length) {
    current[projectId] = entries;
  } else {
    delete current[projectId];
  }
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(current));
};

const mergePersistedFeedback = (
  project: Project,
  persisted: Record<string, ProjectFeedback[]>,
): Project => {
  const stored = persisted[project.id] ?? [];
  if (!stored.length && !(project.feedbackEntries?.length)) {
    return project;
  }
  const combined = [...stored, ...(project.feedbackEntries ?? [])];
  const seen = new Set<string>();
  const deduped: ProjectFeedback[] = [];
  combined.forEach((entry) => {
    const dedupeKey =
      entry.id || `${project.id}-${entry.createdAt}-${entry.comment}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    deduped.push(entry);
  });
  return { ...project, feedbackEntries: deduped };
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [authView, setAuthView] = useState<AuthView>("main");
  const [tasks, setTasks] = useState(mockTasks);
  const [users, setUsers] = useState(mockUsers);
  const [projects, setProjects] = useState(mockProjects);
  const [workLogs, setWorkLogs] = useState(mockWorkLogs);
  const [materials, setMaterials] = useState(mockMaterials);
  const [_isInitialized, _setIsInitialized] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [lastReloadAt, setLastReloadAt] = useState<number>(0);

  function clampProgress(value: number) {
    return Math.min(100, Math.max(0, value));
  }

  const aggregateProgressByProject = (logs: WorkLogEntry[]) => {
    return logs.reduce<Record<string, number>>((acc, log) => {
      const prev = acc[log.projectId] ?? 0;
      const next = clampProgress(prev + (log.progressPercentage ?? 0));
      acc[log.projectId] = next;
      return acc;
    }, {});
  };

  const syncProjectProgressWithLogs = (logs: WorkLogEntry[]) => {
    const aggregated = aggregateProgressByProject(logs);
    setProjects((prevProjects) =>
      prevProjects.map((project) => {
        const derived = aggregated[project.id];
        if (derived === undefined) return project;
        const nextProgress = Math.max(project.progress, derived);
        if (nextProgress === project.progress) return project;
        return { ...project, progress: nextProgress };
      })
    );
  };

  // Initialize time-based theme
  const themeStorageKey = currentUser
    ? `theme-override-${currentUser.role}`
    : "theme-override-guest";
  const {
    isDark: _isDark,
    isTransitioning,
    setTheme,
    getCurrentTheme,
  } = useTimeBasedTheme({ storageKey: themeStorageKey });

  // Initialize: restore session and view, then database and data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Restore session
        let storedUserRaw: string | null = null;
        let hasHash = false;
        try {
          storedUserRaw = localStorage.getItem("currentUser");
          if (storedUserRaw) {
            const parsed = JSON.parse(storedUserRaw) as User;
            setCurrentUser(parsed);
          }
          const hash = (window.location.hash || "").slice(1);
          hasHash = Boolean(hash);
          if (!hash) {
            // Default to dashboard for signed-in users
            if (storedUserRaw) {
              setCurrentView("dashboard");
              try {
                window.location.hash = "dashboard";
              } catch {}
            }
          }
        } catch {}

        // Check if backend is available
        const healthCheck = await apiService.healthCheck();
        if (healthCheck.error) {
          console.warn(
            "Backend not available. Running in demo mode with local data."
          );
          setBackendHealthy(false);
          _setIsInitialized(true);
          return;
        }

        // Validate session against the backend before loading protected data
        let sessionUser: User | null = null;
        try {
          const meResponse = await apiService.getMe();
          const meUser = (meResponse.data as any)?.user;
          if (meUser) {
            sessionUser = mapUserDataFromBackend(meUser);
          }
        } catch (sessionError) {
          console.warn("Failed to restore session:", sessionError);
        }

        if (!sessionUser) {
          if (storedUserRaw) {
            try {
              localStorage.removeItem("currentUser");
            } catch {}
          }
          setCurrentUser(null);
          setBackendHealthy(true);
          _setIsInitialized(true);
          return;
        }

        setCurrentUser(sessionUser);
        try {
          localStorage.setItem("currentUser", JSON.stringify(sessionUser));
        } catch {}
        if (!hasHash) {
          setCurrentView("dashboard");
          try {
            window.location.hash = "dashboard";
          } catch {}
        }

        // Load data from database
        await loadDataFromDatabase();
        setBackendHealthy(true);
        _setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize app:", error);
        console.warn("Falling back to demo mode with local data.");
        setBackendHealthy(false);
        _setIsInitialized(true); // Continue with local data
      }
    };

    initializeApp();
  }, []);

  // Enforce role-based access to views and normalize to dashboard if disallowed
  useEffect(() => {
    if (!currentUser) return;

    const role = currentUser.role;
    const allowedByRole: Record<User["role"], ReadonlyArray<ViewType>> = {
      admin: [
        "dashboard",
        "projects",
        "tasks",
        "users",
        "materials",
        "reports",
        "settings",
        "team",
        "revenue",
        "assignments",
        "archives",
        "activity-logs",
        "billing"
      ],
      supervisor: [
        "dashboard",
        "projects",
        "tasks",
        "team",
        "reports",
        "archives",
      ],
      fabricator: [
        "dashboard",
        "projects",
        "assignments",
        "worklog",
        "materials",
        "tasks",
      ],
      client: ["dashboard", "project-status", "documentation"],
    } as const;

    const allowed = allowedByRole[role] || ["dashboard"];
    if (!allowed.includes(currentView)) {
      setCurrentView("dashboard");
      try {
        window.location.hash = "dashboard";
      } catch {}
    }
  }, [currentUser?.role, currentView]);

  const loadDataFromDatabase = async () => {
    try {
      const [projectsRes, tasksRes, workLogsRes, materialsRes, usersRes] =
        await Promise.all([
          apiService.getProjects(),
          apiService.getTasks(),
          apiService.getWorkLogs(),
          apiService.getMaterials(),
          apiService.getUsers(),
        ]);

      if (projectsRes.data) {
        const persistedFeedback = readPersistedFeedback();
        const mappedProjects = mapProjectsFromBackend(projectsRes.data);
        const mergedProjects = mappedProjects.map((project) =>
          mergePersistedFeedback(project, persistedFeedback),
        );
        setProjects(mergedProjects);
      }

      if (tasksRes.data) {
        setTasks(mapTasksFromBackend(tasksRes.data));
      }

      if (workLogsRes.data) {
        const mappedLogs = mapWorkLogsFromBackend(workLogsRes.data);
        setWorkLogs(mappedLogs);
        syncProjectProgressWithLogs(mappedLogs);
      }

      if (materialsRes.data) {
        setMaterials(mapMaterialsFromBackend(materialsRes.data));
      }

      if (usersRes.data) {
        setUsers(usersRes.data.map(mapUserDataFromBackend));
      }
    } catch (error) {
      console.error("Failed to load data from database:", error);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } catch {}
    setCurrentView("dashboard");
    try {
      window.location.hash = "dashboard";
    } catch {}
    if (backendHealthy !== false) {
      loadDataFromDatabase().then(() => setLastReloadAt(Date.now()));
    }
  };

  const handleUpdateCurrentUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    } catch {}
    setUsers((prevUsers) => {
      const exists = prevUsers.some((user) => user.id === updatedUser.id);
      if (!exists) {
        return [...prevUsers, updatedUser];
      }
      return prevUsers.map((user) =>
        user.id === updatedUser.id ? updatedUser : user
      );
    });
  };

  const handleLogout = () => {
    apiService.logout();
    setCurrentUser(null);
    setCurrentView("dashboard");
    setAuthView("main");
    try {
      localStorage.removeItem("currentUser");
    } catch {}
    try {
      window.location.hash = "dashboard";
    } catch {}
  };

  const handleSignup = (newUser: User) => {
    // Add the new user to the users list
    setUsers((prevUsers) => [...prevUsers, newUser]);
    // Log them in immediately
    setCurrentUser(newUser);
    try {
      localStorage.setItem("currentUser", JSON.stringify(newUser));
    } catch {}
    setCurrentView("dashboard");
  };

  // Add user to list without changing the current session (for admin creating clients)
  const handleAddUser = (newUser: User) => {
    setUsers((prevUsers) => {
      const exists = prevUsers.some((user) => user.id === newUser.id);
      if (exists) {
        return prevUsers.map((user) =>
          user.id === newUser.id ? newUser : user
        );
      }
      return [...prevUsers, newUser];
    });

    if (currentUser?.id === newUser.id) {
      setCurrentUser(newUser);
      try {
        localStorage.setItem("currentUser", JSON.stringify(newUser));
      } catch {}
    }
  };

  const handleShowFabricatorSignup = () => {
    setAuthView("fabricator-signup");
  };

  const handleShowForgotPassword = () => {
    setAuthView("forgot-password");
  };

  const handleBackToMain = () => {
    setAuthView("main");
  };

  const handleUpdateTaskStatus = async (
    taskId: string,
    status: Task["status"]
  ) => {
    const previousTask = tasks.find((task) => task.id === taskId);
    const updatedAt = new Date().toISOString();

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status, updatedAt } : task
      )
    );

    try {
      const { data } = await apiService.updateTask(taskId, { status, updatedAt });
      if (data) {
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskId ? { ...task, ...data } : task))
        );
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
      if (previousTask) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, ...previousTask } : task
          )
        );
      }
    }
  };

  const handleCreateTask = (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">
  ) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prevTasks) => [newTask, ...prevTasks]);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await apiService.deleteTask(taskId);

      if (error) {
        console.error("Delete failed:", error);
        return;
      }

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      
    } catch (err) {
      console.error("An unexpected error occurred during deletion:", err);
    }
  };

  const handleCreateProject = async (
    projectData: Omit<Project, "id">
  ): Promise<Project> => {
    try {
      const response = await apiService.createProject(projectData);

      if (response.data) {
        // Normalize backend response to frontend shape
        const mapped = mapProjectsFromBackend([response.data])[0];
        setProjects((prevProjects) => [mapped, ...prevProjects]);
        return mapped;
      } else {
        throw new Error(response.error || "Failed to create project");
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      // Fallback to local creation
      const newProject: Project = {
        ...projectData,
        id: `project-${Date.now()}`,
      };
      setProjects((prevProjects) => [newProject, ...prevProjects]);
      return newProject;
    }
  };

  const handleAddWorkLog = async (
    workLogData: Omit<WorkLogEntry, "id" | "createdAt">
  ) => {
    try {
      // 1. CALL THE API (Send data to PHP)
      // Note: We use the existing apiService to keep your code clean
      const response = await apiService.createWorkLog(workLogData);

      // 2. CHECK FOR ERRORS
      if (response.error) {
        console.error("Backend refused the log:", response.error);
        alert("Failed to save work log: " + response.error + "----" + response.data);
        return;
      }

      // 3. GET THE REAL LOG (With the ID from the database)
      const savedLog = response.data ? mapWorkLogFromBackend(response.data) : null;

      if (!savedLog) {
        alert("Server responded but returned no data.");
        return;
      }

      // 4. UPDATE THE UI (State)
      setWorkLogs((prevLogs) => {
        const nextLogs = [savedLog, ...prevLogs];
        syncProjectProgressWithLogs(nextLogs);
        return nextLogs;
      });

      // Update project progress based on real work log data
      const progressIncrease = Number.isFinite(savedLog.progressPercentage)
        ? savedLog.progressPercentage
        : 0;
      let updatedProjectSnapshot: Project | null = null;
      setProjects((prevProjects) =>
        prevProjects.map((project) => {
          if (project.id !== savedLog.projectId) return project;
          const nextProgress = clampProgress(project.progress + progressIncrease);
          updatedProjectSnapshot = {
            ...project,
            progress: nextProgress,
          };
          return updatedProjectSnapshot;
        })
      );

      if (updatedProjectSnapshot) {
        handleUpdateProject(updatedProjectSnapshot);
      }
    } catch (error) {
      console.error("Network crash:", error);
      alert("Network Error: Could not save work log.");
    }
  };

  const handleUpdateWorkLog = async (
    id: string,
    updates: Partial<WorkLogEntry>
  ) => {
    const previousLog = workLogs.find((log) => log.id === id);
    if (!previousLog) return;

    const previousLogs = workLogs;
    const previousProjectProgress =
      projects.find((project) => project.id === previousLog.projectId)?.progress ??
      0;

    const normalizedUpdates: Partial<WorkLogEntry> = {
      ...updates,
    };

    if (typeof updates.progressPercentage === "number") {
      normalizedUpdates.progressPercentage = clampProgress(
        updates.progressPercentage
      );
    }

    if (typeof updates.hoursWorked === "number") {
      normalizedUpdates.hoursWorked = Math.max(0, updates.hoursWorked);
    }

    const nextProgressValue =
      typeof normalizedUpdates.progressPercentage === "number"
        ? normalizedUpdates.progressPercentage
        : previousLog.progressPercentage;
    const progressDelta =
      typeof normalizedUpdates.progressPercentage === "number"
        ? nextProgressValue - previousLog.progressPercentage
        : 0;
    const nextProjectProgress =
      progressDelta !== 0
        ? clampProgress(previousProjectProgress + progressDelta)
        : previousProjectProgress;

    const nextMaterials = Array.isArray(normalizedUpdates.materials)
      ? normalizedUpdates.materials
      : previousLog.materials;

    const updatedLog: WorkLogEntry = {
      ...previousLog,
      ...normalizedUpdates,
      materials:
        Array.isArray(nextMaterials) && nextMaterials.length > 0
          ? nextMaterials
          : undefined,
    };

    setWorkLogs((prevLogs) =>
      prevLogs.map((log) => (log.id === id ? updatedLog : log))
    );

    if (progressDelta !== 0) {
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === previousLog.projectId
            ? { ...project, progress: nextProjectProgress }
            : project
        )
      );
    }

    try {
      const response = await apiService.updateWorkLog(id, {
        date: normalizedUpdates.date,
        description: normalizedUpdates.description,
        progressPercentage: normalizedUpdates.progressPercentage,
        hoursWorked: normalizedUpdates.hoursWorked,
        materials: normalizedUpdates.materials,
      });

      if (response.data) {
        const mapped = mapWorkLogFromBackend(response.data);
        setWorkLogs((prevLogs) =>
          prevLogs.map((log) => (log.id === id ? mapped : log))
        );
      }

    } catch (error) {
      console.error("Failed to update work log:", error);
      setWorkLogs(previousLogs);
      if (progressDelta !== 0) {
        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project.id === previousLog.projectId
              ? { ...project, progress: previousProjectProgress }
              : project
          )
        );
      }
      alert("Failed to update work log.");
    }
  };

  const handleDeleteWorkLog = async (id: string) => {
    const previousLog = workLogs.find((log) => log.id === id);
    if (!previousLog) return;

    const previousLogs = workLogs;
    const previousProjectProgress =
      projects.find((project) => project.id === previousLog.projectId)?.progress ??
      0;
    const progressDelta = Number.isFinite(previousLog.progressPercentage)
      ? -previousLog.progressPercentage
      : 0;
    const nextProjectProgress =
      progressDelta !== 0
        ? clampProgress(previousProjectProgress + progressDelta)
        : previousProjectProgress;

    setWorkLogs((prevLogs) => prevLogs.filter((log) => log.id !== id));

    if (progressDelta !== 0) {
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === previousLog.projectId
            ? { ...project, progress: nextProjectProgress }
            : project
        )
      );
    }

    try {
      await apiService.deleteWorkLog(id);
    } catch (error) {
      console.error("Failed to delete work log:", error);
      setWorkLogs(previousLogs);
      if (progressDelta !== 0) {
        setProjects((prevProjects) =>
          prevProjects.map((project) =>
            project.id === previousLog.projectId
              ? { ...project, progress: previousProjectProgress }
              : project
          )
        );
      }
      alert("Failed to delete work log.");
    }
  };

  const handleAddMaterial = async (
    materialData: Omit<Material, "id" | "addedAt">
  ) => {
    try {
      const payload = {
        ...materialData,
        projectId: materialData.projectId ?? "general",
        costPerUnit: materialData.cost,
        totalCost: materialData.cost * materialData.quantity,
      };
      const response = await apiService.createMaterial(payload);

      if (response.data) {
        const mapped = mapMaterialFromBackend(response.data);
        setMaterials((prevMaterials) => [mapped, ...prevMaterials]);
        return;
      }
      throw new Error(response.error || "Failed to save material");
    } catch (error) {
      console.error("Failed to save material:", error);
      alert("Failed to save material. It will only be stored locally.");
      const newMaterial: Material = {
        ...materialData,
        id: `mat-${Date.now()}`,
        addedAt: new Date().toISOString(),
      };
      setMaterials((prevMaterials) => [newMaterial, ...prevMaterials]);
    }
  };

  const handleAcceptAssignment = async (
    assignmentId: string,
    response?: string,
    projectId?: string
  ) => {
    // If projectId is provided, it might be a supervisor accepting a project
    const targetProjectId =
      projectId ||
      (assignmentId
        ? projects.find((p) =>
            p.pendingAssignments?.some((a) => a.id === assignmentId)
          )?.id
        : null);

    if (!targetProjectId) return;

    try {
      await apiService.respondToAssignment(
        targetProjectId,
        "accepted",
        assignmentId || undefined
      );

      // Update local state
      setProjects((prevProjects) =>
        prevProjects.map((project) => {
          if (project.id !== targetProjectId) return project;

          // Supervisor acceptance
          if (
            currentUser?.role === "supervisor" &&
            project.pendingSupervisors?.includes(currentUser.id)
          ) {
            return {
              ...project,
              supervisorId: currentUser.id,
              pendingSupervisors: project.pendingSupervisors.filter(
                (id) => id !== currentUser.id
              ),
              status: "planning", // or strictly mapped status
            };
          }

          // Fabricator acceptance
          return {
            ...project,
            pendingAssignments: project.pendingAssignments?.map((assignment) =>
              assignment.id === assignmentId
                ? {
                    ...assignment,
                    status: "accepted" as const,
                    response,
                    respondedAt: new Date().toISOString(),
                  }
                : assignment
            ),
            fabricatorIds: project.pendingAssignments?.find(
              (a) => a.id === assignmentId && a.status === "pending"
            )
              ? [
                  ...project.fabricatorIds,
                  project.pendingAssignments.find((a) => a.id === assignmentId)!
                    .fabricatorId,
                ]
              : project.fabricatorIds,
            status: project.pendingAssignments?.find(
              (a) => a.id === assignmentId && a.status === "pending"
            )
              ? ("planning" as const) // Or 'in-progress' logic
              : project.status,
          };
        })
      );
    } catch (error) {
      console.error("Failed to accept assignment", error);
    }
  };

  const handleDeclineAssignment = async (
    assignmentId: string,
    response?: string,
    projectId?: string
  ) => {
    const targetProjectId =
      projectId ||
      (assignmentId
        ? projects.find((p) =>
            p.pendingAssignments?.some((a) => a.id === assignmentId)
          )?.id
        : null);
    if (!targetProjectId) return;

    try {
      await apiService.respondToAssignment(
        targetProjectId,
        "declined",
        assignmentId || undefined
      );

      setProjects((prevProjects) =>
        prevProjects.map((project) => {
          if (project.id !== targetProjectId) return project;

          if (
            currentUser?.role === "supervisor" &&
            project.pendingSupervisors?.includes(currentUser.id)
          ) {
            return {
              ...project,
              pendingSupervisors: project.pendingSupervisors.filter(
                (id) => id !== currentUser.id
              ),
            };
          }

          return {
            ...project,
            pendingAssignments: project.pendingAssignments?.map((assignment) =>
              assignment.id === assignmentId
                ? {
                    ...assignment,
                    status: "declined" as const,
                    response,
                    respondedAt: new Date().toISOString(),
                  }
                : assignment
            ),
          };
        })
      );
    } catch (error) {
      console.error("Failed to decline assignment", error);
    }
  };

  const handleAssignFabricator = (
    projectId: string,
    fabricatorId: string,
    message?: string
  ) => {
    const project = projects.find((p) => p.id === projectId);
    const fabricator = users.find((u) => u.id === fabricatorId);
    const supervisor = currentUser;

    if (!project || !fabricator || !supervisor) return;

    const newAssignment: ProjectAssignment = {
      id: `pa-${Date.now()}`,
      projectId,
      fabricatorId,
      assignedBy: currentUser!.id,
      assignedAt: new Date().toISOString(),
      status: "pending",
      message,
    };

    const updatedPendingAssignments = [
      ...(project.pendingAssignments || []),
      newAssignment,
    ];
    const updatedStatus: Project["status"] = "pending-assignment";

    setProjects((prevProjects) =>
      prevProjects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              pendingAssignments: updatedPendingAssignments,
              status: updatedStatus,
            }
          : p
      )
    );

    apiService
      .updateProject(projectId, {
        pendingAssignments: updatedPendingAssignments,
        status: updatedStatus,
      })
      .catch((error) => {
        console.warn("Failed to persist fabricator assignment.", error);
      });

    // Send email notification
    emailService.sendProjectAssignment(
      newAssignment,
      project,
      fabricator,
      supervisor
    );

    // Create initial tasks for the project when assigning fabricator
    const projectTasks: Omit<Task, "id" | "createdAt" | "updatedAt">[] = [
      {
        projectId,
        title: "Project Planning Review",
        description:
          "Review project requirements and create detailed work plan",
        status: "pending",
        priority: "high",
        assignedTo: fabricatorId,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 7 days from now
        estimatedHours: 8,
        actualHours: 0,
        createdBy: currentUser.id,
      },
      {
        projectId,
        title: "Material Assessment",
        description: "Assess and order required materials for the project",
        status: "pending",
        priority: "medium",
        assignedTo: fabricatorId,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 10 days from now
        estimatedHours: 4,
        actualHours: 0,
        createdBy: currentUser.id,
      },
    ];

    // Add the tasks to the task list
    const newTasks = projectTasks.map((taskData) => ({
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setTasks((prevTasks) => [...prevTasks, ...newTasks]);
  };

  const handleBroadcastFabricators = async (
    projectId: string,
    message?: string
  ) => {
    try {
      const response = await apiService.broadcastToFabricators(
        projectId,
        message
      );
      if (response.data?.assignments) {
        // Update project with new pending assignments
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  pendingAssignments: response.data.assignments,
                  status: "pending-assignment",
                }
              : p
          )
        );
        // Email notifications could be triggered here or by backend.
        // Backend is cleaner for "broadcast" but emailService is client-side mock mostly.
        // We'll skip client-side email loop for broadcast to avoid spamming from browser.
      }
    } catch (error) {
      console.error("Broadcast failed", error);
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    // Optimistic update for responsiveness
    setProjects((prevProjects) =>
      prevProjects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    persistFeedbackForProject(
      updatedProject.id,
      updatedProject.feedbackEntries ?? [],
    );

    // Persist in background; keep UI responsive
    try {
      await apiService.updateProject(updatedProject.id, updatedProject);
    } catch (e) {
      console.warn(
        "Failed to persist project update; will retry on next refresh.",
        e
      );
    }

    // Send email notification about project update
    if (currentUser) {
      emailService.sendProjectUpdate(
        updatedProject,
        users,
        "progress_update",
        currentUser
      );
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await apiService.deleteProject(projectId);
      if (!response.error) {
        setProjects((prevProjects) =>
          prevProjects.filter((p) => p.id !== projectId)
        );
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      // Still remove from UI on error for better UX (could add toast notification here)
      setProjects((prevProjects) =>
        prevProjects.filter((p) => p.id !== projectId)
      );
    }
  };

  const handleUpdateMaterial = async (id: string, updates: Partial<Material>) => {
    try {
      // 1. Call API
      const response = await apiService.updateMaterial(id, updates);
      
      if (response.data) {
        // 2. Map backend response if necessary (assuming mapMaterialFromBackend handles raw DB format)
        const updatedMaterial = mapMaterialFromBackend(response.data);
        
        // 3. Update Local State
        setMaterials((prevMaterials) =>
          prevMaterials.map((m) => (m.id === id ? updatedMaterial : m))
        );
      } else {
         console.error("Failed to update material:", response.error);
      }
    } catch (error) {
      console.error("Error updating material:", error);
      // Optional: Add a toast notification here
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      // 1. Call API
      const response = await apiService.deleteMaterial(id);
      
      if (!response.error) {
        // 2. Update Local State
        setMaterials((prevMaterials) => 
          prevMaterials.filter((m) => m.id !== id)
        );
      } else {
        console.error("Failed to delete material:", response.error);
      }
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  };
  // Handle navigation based on URL hash
  useEffect(() => {
    const validViews = [
      "dashboard",
      "projects",
      "tasks",
      "users",
      "materials",
      "reports",
      "settings",
      "team",
      "worklog",
      "revenue",
      "assignments",
      "fabricators",
      "spent",
      "archives",
      "project-status",
      "documentation",
      "admin-projects",
      "admin-tasks",
      "activity-logs",
      "billing",
    ] as const;

    const handleHashChange = () => {
      const rawHash = window.location.hash.slice(1);
      // Redirect admin-projects and admin-tasks to projects
      if (rawHash === "admin-projects" || rawHash === "admin-tasks") {
        window.location.hash = "projects";
        setCurrentView("projects");
        try {
          localStorage.setItem("currentView", "projects");
        } catch {}
        return;
      }
      // Redirect fabricators from assignments to projects
      if (rawHash === "assignments" && currentUser?.role === "fabricator") {
        window.location.hash = "projects";
        setCurrentView("projects");
        try {
          localStorage.setItem("currentView", "projects");
        } catch {}
        return;
      }
      if (validViews.includes(rawHash as (typeof validViews)[number])) {
        setCurrentView(rawHash as ViewType);
        try {
          localStorage.setItem("currentView", rawHash);
        } catch {}
      } else if (!rawHash) {
        // Default to dashboard when no hash is present
        setCurrentView("dashboard");
        try {
          localStorage.setItem("currentView", "dashboard");
        } catch {}
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    // Also update immediately on in-app anchor clicks to be resilient to UI wrappers
    const handleAnchorClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const raw = anchor.getAttribute("href") || "";
      const view = raw.startsWith("#") ? raw.slice(1) : raw;
      if (validViews.includes(view as (typeof validViews)[number])) {
        setCurrentView(view as ViewType);
      }
    };
    document.addEventListener("click", handleAnchorClick);
    // On first load, prefer hash; else restore last view for signed-in user
    const rawHash = window.location.hash.slice(1);
    if (validViews.includes(rawHash as (typeof validViews)[number])) {
      handleHashChange();
    } else {
      try {
        const storedUser = localStorage.getItem("currentUser");
        const storedView = localStorage.getItem(
          "currentView"
        ) as ViewType | null;
        if (storedUser) {
          const view =
            storedView && (validViews as readonly string[]).includes(storedView)
              ? storedView
              : "dashboard";
          setCurrentView(view as ViewType);
          if (!rawHash) {
            try {
              window.location.hash = view;
            } catch {}
          }
        }
      } catch {}
    }

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  // Periodically check backend health and auto-reload data when it comes back
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await apiService.healthCheck();
        const healthy = !res.error;
        if (!isMounted) return;
        setBackendHealthy((prev) => {
          // Transition from unhealthy -> healthy: reload data
          if (prev === false && healthy && currentUser) {
            loadDataFromDatabase()
              .then(() => setLastReloadAt(Date.now()))
              .catch(() => {});
          }
          return healthy;
        });
      } catch {
        if (!isMounted) return;
        setBackendHealthy(false);
      }
    }, 20000); // 20s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser]);

  // Refresh when tab gains focus or when coming back online
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && backendHealthy && currentUser) {
        // Avoid excessive reloads: only if >10s since last reload
        if (Date.now() - lastReloadAt > 10000) {
          loadDataFromDatabase()
            .then(() => setLastReloadAt(Date.now()))
            .catch(() => {});
        }
      }
    };
    const handleOnline = () => {
      // Give the backend a moment, then check and reload
      setTimeout(async () => {
        const res = await apiService.healthCheck();
        const healthy = !res.error;
        setBackendHealthy(healthy);
        if (healthy && currentUser) {
          loadDataFromDatabase()
            .then(() => setLastReloadAt(Date.now()))
            .catch(() => {});
        }
      }, 1000);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
    };
  }, [backendHealthy, currentUser, lastReloadAt]);

  if (!currentUser) {
    switch (authView) {
      case "fabricator-signup":
        return (
          <FabricatorSignupForm
            onSignup={handleSignup}
            onBackToMain={handleBackToMain}
          />
        );

      case "forgot-password":
        return <ForgotPasswordForm onBackToLogin={handleBackToMain} />;

      default:
        return (
          <LoginForm
            onLogin={handleLogin}
            onShowSignup={handleShowFabricatorSignup}
            onShowForgotPassword={handleShowForgotPassword}
          />
        );
    }
  }

  const renderView = () => {
    // Client users get a special dashboard
    if (currentUser.role === "client") {
      switch (currentView) {

        
        case "dashboard":
          return (
            <ClientDashboard
              currentUser={currentUser}
              projects={projects}
              users={users}
              workLogs={workLogs}
              tasks={tasks}
            />
          );
        case "project-status":
          return (
            <ClientProjectStatus
              currentUser={currentUser}
              projects={projects}
              users={users}
              workLogs={workLogs}
              tasks={tasks}
            />
          );
        case "documentation":
          return (
            <ClientDocumentation
              currentUser={currentUser}
              projects={projects}
              users={users}
              workLogs={workLogs}
              tasks={tasks}
              onUpdateProject={handleUpdateProject}
            />
          );

          case "billing":
          return <ClientBilling />;
        default:
          return (
            <ClientDashboard
              currentUser={currentUser}
              projects={projects}
              users={users}
              workLogs={workLogs}
              tasks={tasks}
            />
          );
      }
    }

    switch (currentView) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <DashboardStats
              projects={projects}
              tasks={tasks}
              users={users}
              currentUser={currentUser}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <ProjectOverview projects={projects} currentUser={currentUser} />
              <TaskList
                tasks={tasks}
                projects={projects}
                currentUser={currentUser}
                onUpdateTaskStatus={handleUpdateTaskStatus}
              />
            </div>
          </div>
        );

      case "projects":
        return (
          <ProjectsGrid
            projects={projects}
            users={users}
            currentUser={currentUser}
            onCreateProject={
              currentUser.role === "admin" || currentUser.role === "supervisor"
                ? handleCreateProject
                : undefined
            }
            onAssignFabricator={
              currentUser.role === "supervisor"
                ? handleAssignFabricator
                : undefined
            }
            onUpdateProject={handleUpdateProject}
            onAcceptAssignment={handleAcceptAssignment}
            onDeclineAssignment={handleDeclineAssignment}
            onCreateUser={handleAddUser}
            onBroadcastFabricators={
              currentUser.role === "supervisor"
                ? handleBroadcastFabricators
                : undefined
            }
          />
        );

        // ... inside renderView ...

      case "materials":
        if (currentUser.role === "fabricator") {
          return (
            <MaterialsManager
              currentUser={currentUser}
              projects={projects}
              materials={materials}
              onAddMaterial={handleAddMaterial}
              // ADD THESE TWO LINES:
              onUpdateMaterial={handleUpdateMaterial}
              onDeleteMaterial={handleDeleteMaterial}
            />
          );
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Materials management is only available for fabricators.
              </p>
            </div>
          </div>
        );
      case "team":
        if (currentUser.role === "admin" || currentUser.role === "supervisor") {
          return (
            <TeamOverview
              users={users}
              projects={projects}
              tasks={tasks}
              workLogs={workLogs}
              currentUser={currentUser}
              onAssignFabricator={handleAssignFabricator}
            />
          );
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Team overview is only available for admins and supervisors.
              </p>
            </div>
          </div>
        );

case "activity-logs":
    // Only allow admins to see this component
    if (currentUser.role === "admin") {
      return <ActivityLogs />;
    }
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            Activity logs are only available for administrators.
          </p>
        </div>
      </div>
    );

      case "assignments":
        // Redirect fabricators to projects (assignments merged into projects)
        if (currentUser.role === "fabricator") {
          if (typeof window !== "undefined") {
            window.location.hash = "projects";
          }
          return (
            <ProjectsGrid
              projects={projects}
              users={users}
              currentUser={currentUser}
              onCreateProject={undefined}
              onAssignFabricator={undefined}
              onUpdateProject={handleUpdateProject}
              onAcceptAssignment={handleAcceptAssignment}
              onDeclineAssignment={handleDeclineAssignment}
              onCreateUser={handleAddUser}
            />
          );
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Project assignments are only available for fabricators.
              </p>
            </div>
          </div>
        );

      case "worklog":
        if (currentUser.role === "fabricator") {
          return (
            <WorkLogManager
              currentUser={currentUser}
              projects={projects}
              workLogs={workLogs}
              materials={materials}
              onAddWorkLog={handleAddWorkLog}
              onUpdateWorkLog={handleUpdateWorkLog}
              onDeleteWorkLog={handleDeleteWorkLog}
              onUpdateProject={handleUpdateProject}
            />
          );
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Work logs are only available for fabricators.
              </p>
            </div>
          </div>
        );

      case "materials":
        if (currentUser.role === "fabricator") {
          return (
            <MaterialsManager
              currentUser={currentUser}
              projects={projects}
              materials={materials}
              onAddMaterial={handleAddMaterial}
            />
          );
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Materials management is only available for fabricators.
              </p>
            </div>
          </div>
        );

      case "revenue":
        return (
          <RevenueOverview
            projects={projects}
            currentUser={currentUser}
            onUpdateProject={handleUpdateProject}
          />
        );

      case "reports":
        return (
          <ReportsManager
            projects={projects}
            users={users}
            tasks={tasks}
            currentUser={currentUser}
          />
        );

      case "archives":
        if (currentUser.role === "admin" || currentUser.role === "supervisor") {
          return (
            <ProjectArchives
              projects={projects}
              users={users}
              materials={materials}
              workLogs={workLogs}
              currentUser={currentUser}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              onCreateProject={handleCreateProject}
            />
          );
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Archives are only available for admins and supervisors.
              </p>
            </div>
          </div>
        );

      case "users":
        return (
          <UserManagement
            users={users}
            setUsers={setUsers}
            currentUser={currentUser}
          />
        );

      case "settings":
        if (currentUser.role === "admin") {
          return (
            <AdminSettingsPage
              currentUser={currentUser}
              onUpdateCurrentUser={handleUpdateCurrentUser}
            />
          );
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Settings are only available for system administrators.
              </p>
            </div>
          </div>
        );

      case "tasks":
        return (
          <TaskManager
            tasks={tasks}
            projects={projects}
            users={users}
            currentUser={currentUser}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        );

      case "admin-projects":
      case "admin-tasks":
        // These routes redirect to projects via hash change handler
        // Fall through to projects view
        return (
          <ProjectsGrid
            projects={projects}
            users={users}
            currentUser={currentUser}
            onCreateProject={
              currentUser.role === "admin" || currentUser.role === "supervisor"
                ? handleCreateProject
                : undefined
            }
            onAssignFabricator={
              currentUser.role === "supervisor"
                ? handleAssignFabricator
                : undefined
            }
            onUpdateProject={handleUpdateProject}
            onCreateUser={handleAddUser}
          />
        );

        case "billing":
        if (currentUser.role === "admin") {
          return <ClientBilling />;
        }
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Access Restricted</h3>
              <p className="text-muted-foreground">
                Billing is only available for administrators.
              </p>
            </div>
          </div>
        );
      // -----------------------

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg mb-2">Feature Coming Soon</h3>
              <p className="text-muted-foreground">
                The {currentView} section is under development.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <AppLayout
      currentUser={currentUser}
      onLogout={handleLogout}
      currentTheme={getCurrentTheme()}
      onThemeChange={setTheme}
      isTransitioning={isTransitioning}
    >
      {renderView()}
    </AppLayout>
  );
}
