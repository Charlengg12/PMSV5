import { Material } from "../types";

const STATUS_VALUES = new Set<Material["status"]>([
  "ordered",
  "delivered",
  "in-use",
  "depleted",
]);

export function mapMaterialFromBackend(raw: any): Material {
  const rawProjectId = raw.project_id ?? raw.projectId ?? "";
  const projectId =
    typeof rawProjectId === "string" &&
    ["general", "none"].includes(rawProjectId.trim().toLowerCase())
      ? undefined
      : rawProjectId || undefined;
  const quantity = toNumberOrZero(raw.quantity);
  const costPerUnit = toNumberOrZero(
    raw.cost ?? raw.cost_per_unit ?? raw.costPerUnit ?? raw.unit_cost ?? raw.unitCost
  );
  const totalCost = toNumberOrZero(raw.total_cost ?? raw.totalCost);
  let cost = costPerUnit;
  if ((costPerUnit === 0 || !Number.isFinite(costPerUnit)) && quantity > 0 && totalCost > 0) {
    cost = totalCost / quantity;
  }

  return {
    id: raw.id,
    name: raw.name || "",
    description: raw.description ?? undefined,
    quantity,
    unit: raw.unit || "",
    cost,
    supplier: raw.supplier ?? undefined,
    status: normalizeStatus(raw.status),
    projectId,
    addedBy: raw.added_by ?? raw.addedBy ?? raw.user_id ?? raw.created_by ?? "",
    addedAt: normalizeDateTime(raw.added_at ?? raw.addedAt),
    category: raw.category ?? undefined,
  };
}

export function mapMaterialsFromBackend(rows: any[]): Material[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapMaterialFromBackend);
}

function toNumberOrZero(value: any): number {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(n) ? Number(n) : 0;
}

function normalizeStatus(value: any): Material["status"] {
  if (typeof value !== "string") return "ordered";
  const normalized = value.trim().toLowerCase();
  return STATUS_VALUES.has(normalized as Material["status"])
    ? (normalized as Material["status"])
    : "ordered";
}

function normalizeDateTime(value: any): string {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
