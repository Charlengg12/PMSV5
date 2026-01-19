import { WorkLogEntry } from "../types";

export function mapWorkLogFromBackend(raw: any): WorkLogEntry {
  const projectId = raw.project_id ?? raw.projectId ?? "";
  const fabricatorId =
    raw.fabricator_id ?? raw.fabricatorId ?? raw.user_id ?? raw.userId ?? "";
  const createdAt = normalizeDateTime(raw.created_at ?? raw.createdAt);
  const date = normalizeDateOnly(raw.date) || createdAt.split("T")[0];

  const materials = normalizeMaterials(
    raw.materials ?? raw.materials_used ?? raw.materialsUsed
  );

  return {
    id: raw.id,
    projectId,
    fabricatorId,
    date,
    hoursWorked: toNumberOrZero(raw.hours_worked ?? raw.hoursWorked ?? raw.hours),
    description: raw.description ?? "",
    progressPercentage: toNumberOrZero(
      raw.progress_percentage ?? raw.progressPercentage
    ),
    materials: materials.length > 0 ? materials : undefined,
    photos: Array.isArray(raw.photos) ? raw.photos : undefined,
    createdAt,
  };
}

export function mapWorkLogsFromBackend(rows: any[]): WorkLogEntry[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapWorkLogFromBackend);
}

function toNumberOrZero(value: any): number {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? Number(n) : 0;
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

function normalizeMaterials(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter((item) => item.length > 0);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item))
            .filter((item) => item.length > 0);
        }
      } catch {}
    }
    return [trimmed];
  }
  return [];
}
