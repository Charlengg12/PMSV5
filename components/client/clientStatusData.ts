import { Project } from "../../types";

export const STATUS_LABELS: Record<Project["status"], string> = {
  "0_Created": "Created",
  "1_Assigned_to_FAB": "Assigned to Fabricators",
  "2_Ready_for_Supervisor_Review": "Supervisor Review",
  "3_Ready_for_Admin_Review": "Admin Review",
  "4_Ready_for_Client_Signoff": "Client Signoff",
  planning: "Planning",
  "in-progress": "In Progress",
  review: "In Review",
  completed: "Completed",
  "on-hold": "On Hold",
  "pending-assignment": "Pending Assignment",
} as const;

export const STATUS_SEQUENCE: Project["status"][] = [
  "0_Created",
  "1_Assigned_to_FAB",
  "planning",
  "in-progress",
  "2_Ready_for_Supervisor_Review",
  "3_Ready_for_Admin_Review",
  "4_Ready_for_Client_Signoff",
  "completed",
];
