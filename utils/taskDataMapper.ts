import { Task } from "../types";

export function mapTaskFromBackend(raw: any): Task {
  const dueDate = normalizeDateOnly(raw.due_date ?? raw.dueDate);
  const assignedTo = raw.assigned_to ?? raw.assignedTo ?? undefined;

  return {
    id: raw.id,
    projectId: raw.project_id ?? raw.projectId ?? "",
    title: raw.title || "",
    description: raw.description ?? undefined,
    status: raw.status || "pending",
    priority: raw.priority || "medium",
    assignedTo: assignedTo || undefined,
    dueDate,
    estimatedHours: toNumberOrUndefined(raw.estimated_hours ?? raw.estimatedHours),
    actualHours: toNumberOrUndefined(raw.actual_hours ?? raw.actualHours),
    materials: Array.isArray(raw.materials) ? raw.materials : undefined,
    createdBy: raw.created_by ?? raw.createdBy ?? "",
    createdAt: normalizeDateTime(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
    updatedAt: normalizeDateTime(raw.updated_at ?? raw.updatedAt ?? new Date().toISOString()),
  };
}

export function mapTasksFromBackend(rows: any[]): Task[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapTaskFromBackend);
}

function toNumberOrUndefined(value: any): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? Number(n) : undefined;
}

function normalizeDateOnly(value: any): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().split("T")[0];
}

function normalizeDateTime(value: any): string {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
