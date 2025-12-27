import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ensureDbInitialized } from "@/lib/db-utils";
import type {
  MaintenanceRequest,
  CreateRequestInput,
  RequestStatus,
  KanbanBoard,
  CalendarEvent,
  DepartmentReport,
  EquipmentReport,
} from "@/lib/types";
import {
  getEquipmentById,
  scrapEquipment,
  validateEquipment,
} from "./equipment";
import {
  findTechnicianWithMinTasks,
  incrementTechnicianTasks,
  decrementTechnicianTasks,
  getTechnicianById,
} from "./technicians";

const COLLECTION = "requests";

// ============================================
// Basic CRUD Operations
// ============================================

/**
 * Get request by ID
 */
export async function getRequestById(id: string): Promise<MaintenanceRequest | null> {
  ensureDbInitialized();
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as MaintenanceRequest;
}

/**
 * Get all requests
 */
export async function getAllRequests(): Promise<MaintenanceRequest[]> {
  ensureDbInitialized();
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MaintenanceRequest));
}

/**
 * Get requests by department
 */
export async function getRequestsByDepartment(
  department: string
): Promise<MaintenanceRequest[]> {
  const q = query(
    collection(db, COLLECTION),
    where("department", "==", department),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MaintenanceRequest));
}

/**
 * Get requests by equipment
 */
export async function getRequestsByEquipment(
  equipmentId: string
): Promise<MaintenanceRequest[]> {
  const q = query(
    collection(db, COLLECTION),
    where("equipmentId", "==", equipmentId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MaintenanceRequest));
}

/**
 * Get requests by technician
 */
export async function getRequestsByTechnician(
  technicianId: string
): Promise<MaintenanceRequest[]> {
  const q = query(
    collection(db, COLLECTION),
    where("technicianId", "==", technicianId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MaintenanceRequest));
}

// ============================================
// PSEUDOCODE FUNCTION 1: createRequest
// Create corrective request (breakdown repair)
// Auto-assigns technician with minimum active tasks
// ============================================

export async function createRequest(
  input: CreateRequestInput
): Promise<{ success: true; request: MaintenanceRequest } | { success: false; error: string }> {
  try {
    ensureDbInitialized();

    // Input validation
    if (!input.title?.trim()) {
      return { success: false, error: "Request title is required" };
    }
    if (!input.equipmentId?.trim()) {
      return { success: false, error: "Equipment ID is required" };
    }

    // Validate equipment exists and is usable
    let equipment;
    try {
      equipment = await validateEquipment(input.equipmentId);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }

    // Find technician with minimum active tasks in the department
    const assignedTechnician = await findTechnicianWithMinTasks(equipment.department);

    const now = new Date().toISOString();

    const requestData = {
      title: input.title.trim(),
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      department: equipment.department,
      technicianId: assignedTechnician?.id ?? null,
      technicianName: assignedTechnician?.name ?? null,
      type: input.type,
      status: "NEW" as RequestStatus,
      scheduledDate: input.scheduledDate ?? null,
      dueDate: input.scheduledDate ?? null,
      isOverdue: false,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION), requestData);

    // Update technician task count if assigned
    if (assignedTechnician) {
      await incrementTechnicianTasks(assignedTechnician.id);
    }

    const newRequest: MaintenanceRequest = {
      id: docRef.id,
      ...requestData,
    };

    return { success: true, request: newRequest };
  } catch (error) {
    console.error("Error creating request:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create request" };
  }
}

// ============================================
// PSEUDOCODE FUNCTION 2: getKanbanBoard
// Returns requests grouped by status for Kanban view
// ============================================

export async function getKanbanBoard(): Promise<KanbanBoard> {
  ensureDbInitialized();
  const allRequests = await getAllRequests();

  const board: KanbanBoard = {
    NEW: [],
    IN_PROGRESS: [],
    REPAIRED: [],
    SCRAP: [],
  };

  for (const request of allRequests) {
    if (board[request.status]) {
      board[request.status].push(request);
    }
  }

  return board;
}

// ============================================
// PSEUDOCODE FUNCTION 3: updateRequestStatus
// Handle status transitions: NEW → IN_PROGRESS → REPAIRED or SCRAP
// ============================================

export async function updateRequestStatus(
  id: string,
  newStatus: RequestStatus,
  scrapNote?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    ensureDbInitialized();
    const request = await getRequestById(id);
    if (!request) {
      return { success: false, error: "Request not found" };
    }

    const docRef = doc(db, COLLECTION, id);
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: now,
    };

    // Handle status-specific logic
    if (newStatus === "REPAIRED" || newStatus === "SCRAP") {
      updateData.isOverdue = false;

      // Decrement technician tasks when request is completed
      if (request.technicianId) {
        await decrementTechnicianTasks(request.technicianId);
      }
    }

    // Handle SCRAP status - mark equipment as scrapped
    if (newStatus === "SCRAP") {
      if (!scrapNote) {
        return { success: false, error: "Scrap note is required when scrapping equipment" };
      }
      await scrapEquipment(request.equipmentId, scrapNote);
    }

    await updateDoc(docRef, updateData);
    return { success: true };
  } catch (error) {
    console.error("Error updating request status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update request status" };
  }
}

// ============================================
// PSEUDOCODE FUNCTION 4: scrapEquipment
// Called when request status changes to SCRAP
// (This is handled within updateRequestStatus above)
// Separate function for direct equipment scrapping
// ============================================

export async function markEquipmentAsScrap(
  requestId: string,
  scrapNote: string
): Promise<{ success: boolean; error?: string }> {
  return updateRequestStatus(requestId, "SCRAP", scrapNote);
}

// ============================================
// PSEUDOCODE FUNCTION 5: getCalendarData
// Returns calendar events for preventive maintenance scheduling
// ============================================

export async function getCalendarData(): Promise<CalendarEvent[]> {
  const allRequests = await getAllRequests();

  // Filter requests that have scheduled dates (primarily preventive)
  const scheduledRequests = allRequests.filter(r => r.scheduledDate);

  return scheduledRequests.map(request => ({
    id: request.id,
    title: request.title,
    date: request.scheduledDate!,
    type: request.type,
    equipmentName: request.equipmentName,
    status: request.status,
  }));
}

// ============================================
// PSEUDOCODE FUNCTION 6: createPreventiveRequest
// Schedule preventive maintenance for future date
// ============================================

export async function createPreventiveRequest(
  equipmentId: string,
  title: string,
  scheduledDate: string
): Promise<{ success: true; request: MaintenanceRequest } | { success: false; error: string }> {
  return createRequest({
    title,
    equipmentId,
    type: "PREVENTIVE",
    scheduledDate,
  });
}

// ============================================
// PSEUDOCODE FUNCTION 7: checkOverdueRequests
// Update overdue status for all open requests
// ============================================

export async function checkOverdueRequests(): Promise<number> {
  ensureDbInitialized();
  const allRequests = await getAllRequests();
  const now = new Date();
  let updatedCount = 0;

  for (const request of allRequests) {
    // Skip completed requests
    if (request.status === "REPAIRED" || request.status === "SCRAP") {
      continue;
    }

    // Check if request is overdue
    const dueDate = request.dueDate ? new Date(request.dueDate) : null;
    const shouldBeOverdue = dueDate ? dueDate < now : false;

    if (shouldBeOverdue !== request.isOverdue) {
      const docRef = doc(db, COLLECTION, request.id);
      await updateDoc(docRef, {
        isOverdue: shouldBeOverdue,
        updatedAt: now.toISOString(),
      });
      updatedCount++;
    }
  }

  return updatedCount;
}

// ============================================
// PSEUDOCODE FUNCTION 8: reportByDepartment
// Generate report grouped by department
// ============================================

export async function reportByDepartment(): Promise<DepartmentReport[]> {
  ensureDbInitialized();
  const allRequests = await getAllRequests();

  const departmentMap = new Map<string, DepartmentReport>();

  for (const request of allRequests) {
    const dept = request.department;

    if (!departmentMap.has(dept)) {
      departmentMap.set(dept, {
        department: dept,
        totalRequests: 0,
        newCount: 0,
        inProgressCount: 0,
        repairedCount: 0,
        scrapCount: 0,
      });
    }

    const report = departmentMap.get(dept)!;
    report.totalRequests++;

    switch (request.status) {
      case "NEW":
        report.newCount++;
        break;
      case "IN_PROGRESS":
        report.inProgressCount++;
        break;
      case "REPAIRED":
        report.repairedCount++;
        break;
      case "SCRAP":
        report.scrapCount++;
        break;
    }
  }

  return Array.from(departmentMap.values());
}

// ============================================
// PSEUDOCODE FUNCTION 9: reportByEquipment
// Generate report grouped by equipment
// ============================================

export async function reportByEquipment(): Promise<EquipmentReport[]> {
  ensureDbInitialized();
  const allRequests = await getAllRequests();

  const equipmentMap = new Map<string, EquipmentReport>();

  for (const request of allRequests) {
    const eqId = request.equipmentId;

    if (!equipmentMap.has(eqId)) {
      const equipment = await getEquipmentById(eqId);
      equipmentMap.set(eqId, {
        equipmentId: eqId,
        equipmentName: request.equipmentName,
        department: request.department,
        totalRequests: 0,
        isUsable: equipment?.isUsable ?? false,
      });
    }

    const report = equipmentMap.get(eqId)!;
    report.totalRequests++;
  }

  return Array.from(equipmentMap.values());
}

// ============================================
// Additional Helper Functions
// ============================================

/**
 * Assign a request to a specific technician
 */
export async function assignRequest(
  requestId: string,
  technicianId: string
): Promise<{ success: boolean; error?: string }> {
  const request = await getRequestById(requestId);
  if (!request) {
    return { success: false, error: "Request not found" };
  }

  const technician = await getTechnicianById(technicianId);
  if (!technician) {
    return { success: false, error: "Technician not found" };
  }

  // If already assigned to someone else, decrement their task count
  if (request.technicianId && request.technicianId !== technicianId) {
    await decrementTechnicianTasks(request.technicianId);
  }

  const docRef = doc(db, COLLECTION, requestId);
  await updateDoc(docRef, {
    technicianId: technician.id,
    technicianName: technician.name,
    updatedAt: new Date().toISOString(),
  });

  // Increment new technician's task count
  if (request.technicianId !== technicianId) {
    await incrementTechnicianTasks(technicianId);
  }

  return { success: true };
}
