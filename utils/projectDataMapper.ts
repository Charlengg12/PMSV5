import { Project } from '../types';

export function mapProjectFromBackend(raw: any): Project {
  const fabricatorIds = Array.isArray(raw.fabricator_ids)
    ? raw.fabricator_ids
    : typeof raw.fabricator_ids === 'string'
      ? safeParseJsonArray(raw.fabricator_ids)
      : Array.isArray(raw.fabricatorIds)
        ? raw.fabricatorIds
        : [];

  const start = raw.start_date || raw.startDate || null;
  const end = raw.end_date || raw.due_date || raw.endDate || null;

  const pendingAssignments = Array.isArray(raw.pending_assignments)
    ? raw.pending_assignments
    : typeof raw.pending_assignments === 'string'
      ? safeParseJsonArray(raw.pending_assignments)
      : Array.isArray(raw.pendingAssignments)
        ? raw.pendingAssignments
        : [];

  const pendingSupervisors = Array.isArray(raw.pending_supervisors)
    ? raw.pending_supervisors
    : typeof raw.pending_supervisors === 'string'
      ? safeParseJsonArray(raw.pending_supervisors)
      : Array.isArray(raw.pendingSupervisors)
        ? raw.pendingSupervisors
        : [];

  const fabricatorBudgets = Array.isArray(raw.fabricator_budgets)
    ? raw.fabricator_budgets
    : typeof raw.fabricator_budgets === 'string'
      ? safeParseJsonArray(raw.fabricator_budgets)
      : Array.isArray(raw.fabricatorBudgets)
        ? raw.fabricatorBudgets
        : undefined;

  return {
    id: raw.id,
    name: raw.name || raw.title || '',
    description: raw.description || '',
    status: raw.status || 'planning',
    priority: raw.priority || 'medium',
    startDate: normalizeDateString(start),
    endDate: normalizeDateString(end),
    progress: toNumberOrZero(raw.progress),
    supervisorId: raw.supervisor_id || raw.supervisorId || '',
    fabricatorIds,
    budget: toNumberOrZero(raw.budget),
    spent: toNumberOrZero(raw.spent),
    revenue: toNumberOrZero(raw.revenue),
    fabricatorAllocation: toNumberOrZero(raw.fabricator_allocation ?? raw.fabricatorAllocation),
    materialsAllocation: toNumberOrZero(raw.materials_allocation ?? raw.materialsAllocation),
    supervisorAllocation: toNumberOrZero(raw.supervisor_allocation ?? raw.supervisorAllocation),
    companyAllocation: toNumberOrZero(raw.company_allocation ?? raw.companyAllocation),
    clientName: raw.client_name || raw.clientName || '',
    documentationUrl: raw.documentation_url || raw.documentationUrl || undefined,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : undefined,
    fabricatorBudgets,
    createdBy: raw.created_by || raw.createdBy || '',
    createdAt: normalizeDateString(raw.created_at || raw.createdAt || new Date().toISOString()),
    pendingAssignments: pendingAssignments.length > 0 ? pendingAssignments : undefined,
    pendingSupervisors: pendingSupervisors.length > 0 ? pendingSupervisors : undefined,
  } as Project;
}

export function mapProjectsFromBackend(rows: any[]): Project[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapProjectFromBackend);
}

function safeParseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toNumberOrZero(value: any): number {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? Number(n) : 0;
}

function normalizeDateString(value: any): string {
  if (!value) return new Date().toISOString().split('T')[0];
  // If it's already YYYY-MM-DD or ISO, keep as date-only string for consistency
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().split('T')[0];
  }
  return d.toISOString().split('T')[0];
}


