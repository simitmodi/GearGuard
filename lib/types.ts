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
  activeTasks: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Maintenance Request - Repair/maintenance job record
 * Status flow: NEW → IN_PROGRESS → REPAIRED or SCRAP
 */
export interface MaintenanceRequest {
  id: string;
  title: string;
  equipmentId: string;
  equipmentName: string; // Denormalized for display
  department: string;
  technicianId: string | null;
  technicianName: string | null; // Denormalized for display
  type: RequestType;
  status: RequestStatus;
  scheduledDate: string | null; // For preventive maintenance
  dueDate: string | null;
  isOverdue: boolean;
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
}

export interface CreateTechnicianInput {
  name: string;
  department: string;
}

export interface CreateRequestInput {
  title: string;
  equipmentId: string;
  type: RequestType;
  scheduledDate?: string; // Required for PREVENTIVE type
}

export interface UpdateRequestStatusInput {
  status: RequestStatus;
  scrapNote?: string; // Required when status is SCRAP
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
