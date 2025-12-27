// ============================================
// Database Entity Types
// ============================================

/**
 * Equipment - Central database for all company assets
 * Tracks ownership, technical details, and maintenance responsibility
 */
export interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  category: EquipmentCategory;
  department: string;
  
  // Ownership tracking
  assignedTo: string | null; // Employee name who owns/uses this equipment
  assignedToId: string | null; // Employee/User ID
  
  // Location & Physical details
  location: string;
  
  // Purchase & Warranty
  purchaseDate: string;
  warrantyExpiryDate: string | null;
  purchaseCost: number | null;
  vendor: string | null;
  
  // Maintenance responsibility
  maintenanceTeamId: string;
  maintenanceTeam: string; // Team name (denormalized for display)
  defaultTechnicianId: string | null; // Default technician assigned
  defaultTechnicianName: string | null;
  
  // Status tracking
  isUsable: boolean;
  status: EquipmentStatus;
  
  // Maintenance history
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  totalMaintenanceCount: number;
  openRequestCount: number;
  
  // Notes
  notes: string | null;
  
  createdAt: string;
  updatedAt: string;
}

export type EquipmentCategory = 
  | "heavy-machinery"
  | "electronics"
  | "vehicles"
  | "tools"
  | "it-equipment"
  | "hvac"
  | "plumbing"
  | "electrical"
  | "other";

export type EquipmentStatus = 
  | "operational"
  | "under_maintenance"
  | "scrapped"
  | "pending_repair";

/**
 * Maintenance Team - Specialized teams for different types of maintenance
 */
export interface MaintenanceTeam {
  id: string;
  name: string;
  description?: string;
  specialization: TeamSpecialization;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export type TeamSpecialization = 
  | "mechanics"
  | "electricians"
  | "it-support"
  | "hvac"
  | "plumbing"
  | "general"
  | "external-vendor";

/**
 * Technician - Team members who perform maintenance
 */
export interface Technician {
  id: string;
  name: string;
  email: string;
  phone?: string;
  
  // Team assignment
  teamId: string;
  teamName: string; // Denormalized for display
  
  // Role & Status
  role: "technician" | "senior_technician" | "team_lead";
  isActive: boolean;
  
  // Workload tracking
  activeTasks: number;
  completedTasks: number;
  
  // Skills
  skills: string[];
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Maintenance Request - Transactional record for repair jobs
 * Handles the lifecycle of both corrective and preventive maintenance
 */
export interface MaintenanceRequest {
  id: string;
  
  // Request details
  subject: string; // What is wrong? (e.g., "Leaking Oil")
  description: string;
  
  // Equipment reference (auto-filled from equipment)
  equipmentId: string;
  equipmentName: string;
  equipmentCategory: EquipmentCategory;
  equipmentLocation: string;
  
  // Team assignment (auto-filled from equipment)
  maintenanceTeamId: string;
  maintenanceTeam: string;
  
  // Technician assignment
  technicianId: string | null;
  technicianName: string | null;
  
  // Request type
  type: RequestType;
  
  // Workflow state
  stage: RequestStage;
  
  // Priority
  priority: RequestPriority;
  
  // Scheduling
  scheduledDate: string | null;
  dueDate: string | null;
  
  // Duration tracking (for completed requests)
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null; // Hours spent on repair
  
  // Overdue tracking
  isOverdue: boolean;
  
  // Scrap flag
  markedForScrap: boolean;
  scrapNotes: string | null;
  
  // Request creator
  createdById: string | null;
  createdByName: string | null;
  
  createdAt: string;
  updatedAt: string;
}

export type RequestType = "corrective" | "preventive";

export type RequestStage = 
  | "new"           // Just created
  | "assigned"      // Assigned to technician
  | "in_progress"   // Work started
  | "repaired"      // Work completed
  | "scrap";        // Equipment marked for scrap

export type RequestPriority = "low" | "medium" | "high" | "critical";

// ============================================
// API Request/Response Types
// ============================================

export interface CreateEquipmentInput {
  name: string;
  serialNumber: string;
  category: EquipmentCategory;
  department: string;
  location: string;
  assignedTo?: string;
  assignedToId?: string;
  purchaseDate: string;
  warrantyExpiryDate?: string;
  purchaseCost?: number;
  vendor?: string;
  maintenanceTeamId: string;
  defaultTechnicianId?: string;
  notes?: string;
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  specialization: TeamSpecialization;
}

export interface CreateTechnicianInput {
  name: string;
  email: string;
  phone?: string;
  teamId: string;
  role?: "technician" | "senior_technician" | "team_lead";
  skills?: string[];
}

export interface CreateRequestInput {
  subject: string;
  description: string;
  equipmentId: string;
  type: RequestType;
  priority?: RequestPriority;
  scheduledDate?: string;
  createdById?: string;
  createdByName?: string;
}

export interface UpdateRequestInput {
  stage?: RequestStage;
  technicianId?: string;
  duration?: number;
  scrapNotes?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// Dashboard / Report Types
// ============================================

export interface RequestsByTeamReport {
  teamId: string;
  teamName: string;
  totalRequests: number;
  openRequests: number;
  completedRequests: number;
}

export interface RequestsByCategoryReport {
  category: EquipmentCategory;
  totalRequests: number;
  openRequests: number;
  completedRequests: number;
}
