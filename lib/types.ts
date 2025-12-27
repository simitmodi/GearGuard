// ============================================
// GEARGUARD - Simplified Data Models
// Following exact pseudocode specification
// ============================================

/**
 * Equipment - Company assets that need maintenance
 */
export interface Equipment {
  id: string;
  name: string;
  department: string;
  serialNumber: string | null;
  purchaseDate: string | null;
  warrantyExpiration: string | null;
  location: string | null;
  assignedTo: string | null; // Employee name
  maintenanceTeam: string | null; // e.g., "Mechanics", "IT"
  defaultTechnicianId: string | null;
  isUsable: boolean;
  scrapNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Technician - Workers who perform maintenance
 */
export interface Technician {
  id: string;
  name: string;
  department: string;
  // Team mapping could be handled via department or explicit field, using department for now
  activeTasks: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Team - Group of technicians/employees
 */
export interface Team {
  id: string;
  name: string;
  members: string[]; // List of names
  company: string;
  createdAt: string;
}

/**
 * Maintenance Request - Repair/maintenance job record
 * Status flow: NEW → IN_PROGRESS → REPAIRED or SCRAP
 */
export interface MaintenanceRequest {
  id: string;
  title: string;
  equipmentId: string;
  equipmentName: string;
  department: string;
  technicianId: string | null;
  technicianName: string | null;
  type: RequestType;
  status: RequestStatus;
  scheduledDate: string | null;
  dueDate: string | null;
  isOverdue: boolean;
  durationMinutes: number | null; // Track repair time
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Request type: corrective (fix broken) or preventive (scheduled maintenance)
export type RequestType = "CORRECTIVE" | "PREVENTIVE";

// Status flow: NEW → IN_PROGRESS → REPAIRED or SCRAP
export type RequestStatus = "NEW" | "IN_PROGRESS" | "REPAIRED" | "SCRAP";

// ============================================
// API Input Types
// ============================================

export interface CreateEquipmentInput {
  name: string;
  department: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiration?: string;
  location?: string;
  assignedTo?: string;
  maintenanceTeam?: string;
  defaultTechnicianId?: string;
}

export interface CreateTechnicianInput {
  name: string;
  department: string;
}

export interface CreateTeamInput {
  name: string;
  members: string[];
  company: string;
}

export interface CreateRequestInput {
  title: string;
  equipmentId: string;
  type: RequestType;
  scheduledDate?: string;
}

export interface UpdateRequestStatusInput {
  status: RequestStatus;
  scrapNote?: string;
  durationMinutes?: number; // Added for completion
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Kanban Board Types
// ============================================

export interface KanbanBoard {
  NEW: MaintenanceRequest[];
  IN_PROGRESS: MaintenanceRequest[];
  REPAIRED: MaintenanceRequest[];
  SCRAP: MaintenanceRequest[];
}

// ============================================
// Calendar Types
// ============================================

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: RequestType;
  equipmentName: string;
  status: RequestStatus;
}

// ============================================
// Report Types
// ============================================

export interface DepartmentReport {
  department: string;
  totalRequests: number;
  newCount: number;
  inProgressCount: number;
  repairedCount: number;
  scrapCount: number;
}

export interface EquipmentReport {
  equipmentId: string;
  equipmentName: string;
  department: string;
  totalRequests: number;
  isUsable: boolean;
}
