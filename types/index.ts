import { ReactNode } from "react";

export interface User {
  department: ReactNode;
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'fabricator' | 'client';
  school: string; // Changed from department to school
  secureId: string;
  employeeNumber?: string; // Optional for clients
  phone?: string;
  gcashNumber?: string;
  password?: string; // For login credentials
  clientProjectId?: string; // For client users, which project they belong to
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status:
    | '0_Created'
    | '1_Assigned_to_FAB'
    | '2_Ready_for_Supervisor_Review'
    | '3_Ready_for_Admin_Review'
    | '4_Ready_for_Client_Signoff'
    | 'planning'
    | 'in-progress'
    | 'review'
    | 'completed'
    | 'on-hold'
    | 'pending-assignment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string;
  endDate: string;
  progress: number;
  supervisorId: string;
  fabricatorIds: string[];
  
  // --- Financials ---
  budget: number;       // Total Operational Cost (Fab + Mat + Sup)
  spent: number;        // Actual money spent so far
  revenue: number;      // Total Client Price (Budget + Company Alloc)
  
  // Detailed Allocations (Added)
  fabricatorAllocation?: number;
  materialsAllocation?: number;
  supervisorAllocation?: number;
  companyAllocation?: number;
  
  clientName: string;
  documentationUrl?: string; 
  attachments?: ProjectAttachment[];
  fabricatorBudgets?: FabricatorBudget[]; 
  createdBy: string; 
  createdAt: string;
  pendingAssignments?: ProjectAssignment[]; 
  pendingSupervisors?: string[]; 
}

export interface ProjectAssignment {
  id: string;
  projectId: string;
  fabricatorId: string;
  assignedBy: string; // supervisor ID
  assignedAt: string;
  status: 'pending' | 'accepted' | 'declined';
  message?: string; // Optional message from supervisor
  response?: string; // Optional response from fabricator
  respondedAt?: string;
}

export interface WorkLogEntry {
  id: string;
  projectId: string;
  fabricatorId: string;
  date: string;
  hoursWorked: number;
  description: string;
  progressPercentage: number; // How much of the project this entry represents
  materials?: string[]; // Materials used in this work session
  photos?: string[]; // Photo URLs of work progress
  createdAt: string;
}

export interface FabricatorBudget {
  fabricatorId: string;
  allocatedAmount: number;
  spentAmount: number;
  allocatedRevenue: number; // Revenue assigned to this fabricator
  description: string; // What this budget is for
}

export interface ProjectAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string; // File URL or placeholder for actual implementation
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  materials?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  cost: number;
  supplier?: string;
  status: 'ordered' | 'delivered' | 'in-use' | 'depleted';
  projectId?: string; // Which project this material is for
  addedBy: string; // Who added this material
  addedAt: string;
  category?: string; // Material category
}

export interface CompanyRevenue {
  id: string;
  year: number;
  quarter: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  projectsCompleted: number;
}