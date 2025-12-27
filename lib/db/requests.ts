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
import type { 
  MaintenanceRequest, 
  CreateRequestInput, 
  RequestStage,
  UpdateRequestInput 
} from "@/lib/types";
import { 
  getEquipmentById, 
  updateEquipmentRequestCount,
  incrementMaintenanceCount,
  markEquipmentAsScrapped 
} from "./equipment";
import {
  findTechnicianWithMinTasks,
  incrementTechnicianTasks,
  decrementTechnicianTasks,
  getTechnicianById,
} from "./technicians";

const COLLECTION = "requests";

/**
 * Get request by ID
 */
export async function getRequestById(id: string): Promise<MaintenanceRequest | null> {
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
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MaintenanceRequest));
}

/**
 * Get requests by stage
 */
export async function getRequestsByStage(
  stage: RequestStage
): Promise<MaintenanceRequest[]> {
  const q = query(
    collection(db, COLLECTION),
    where("stage", "==", stage),
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

/**
 * Get requests by equipment (for Smart Button)
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
 * Get open requests by equipment (for Smart Button badge count)
 */
export async function getOpenRequestsByEquipment(
  equipmentId: string
): Promise<MaintenanceRequest[]> {
  const allRequests = await getRequestsByEquipment(equipmentId);
  return allRequests.filter(r => !["repaired", "scrap"].includes(r.stage));
}

/**
 * Get requests by team
 */
export async function getRequestsByTeam(
  teamId: string
): Promise<MaintenanceRequest[]> {
  const q = query(
    collection(db, COLLECTION),
    where("maintenanceTeamId", "==", teamId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MaintenanceRequest));
}

/**
 * Get preventive requests (for Calendar View)
 */
export async function getPreventiveRequests(): Promise<MaintenanceRequest[]> {
  const q = query(
    collection(db, COLLECTION),
    where("type", "==", "preventive"),
    orderBy("scheduledDate", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MaintenanceRequest));
}

/**
 * Get requests scheduled for a specific date (for Calendar View)
 */
export async function getRequestsByScheduledDate(
  date: string
): Promise<MaintenanceRequest[]> {
  // date should be in YYYY-MM-DD format
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;
  
  const q = query(
    collection(db, COLLECTION),
    where("scheduledDate", ">=", startOfDay),
    where("scheduledDate", "<=", endOfDay)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MaintenanceRequest));
}

/**
 * Check if a request is overdue
 */
function calculateIsOverdue(scheduledDate: string | null, stage: RequestStage): boolean {
  if (!scheduledDate || ["repaired", "scrap"].includes(stage)) {
    return false;
  }
  return new Date(scheduledDate) < new Date();
}

/**
 * Create a new maintenance request with auto-fill and auto-assignment
 * 
 * Flow 1 (Breakdown) & Flow 2 (Routine Checkup):
 * 1. User creates request and selects Equipment
 * 2. Auto-Fill: System fetches Equipment category, team from equipment record
 * 3. Request starts in "new" stage
 * 4. Optionally auto-assigns to technician with least tasks
 */
export async function createRequest(
  input: CreateRequestInput
): Promise<{ success: true; request: MaintenanceRequest } | { success: false; error: string }> {
  // Step 1: Get and validate equipment
  const equipment = await getEquipmentById(input.equipmentId);

  if (!equipment) {
    return { success: false, error: "Equipment not found" };
  }

  if (!equipment.isUsable || equipment.status === "scrapped") {
    return { success: false, error: "Equipment is scrapped and cannot be maintained" };
  }

  // Step 2: Auto-fill from equipment
  // Find technician with minimum active tasks in the equipment's maintenance team
  const assignedTechnician = await findTechnicianWithMinTasks(equipment.maintenanceTeamId);

  // Step 3: Create the maintenance request
  const now = new Date().toISOString();
  const scheduledDate = input.scheduledDate ?? null;
  
  const requestData = {
    // Request details
    subject: input.subject,
    description: input.description,
    
    // Auto-filled from equipment
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    equipmentCategory: equipment.category,
    equipmentLocation: equipment.location,
    
    // Auto-filled team from equipment
    maintenanceTeamId: equipment.maintenanceTeamId,
    maintenanceTeam: equipment.maintenanceTeam,
    
    // Technician assignment (auto or null)
    technicianId: assignedTechnician?.id ?? null,
    technicianName: assignedTechnician?.name ?? null,
    
    // Request type and state
    type: input.type,
    stage: (assignedTechnician ? "assigned" : "new") as RequestStage,
    priority: input.priority ?? "medium",
    
    // Scheduling
    scheduledDate,
    dueDate: scheduledDate,
    
    // Duration tracking
    startedAt: null,
    completedAt: null,
    duration: null,
    
    // Overdue tracking
    isOverdue: calculateIsOverdue(scheduledDate, "new"),
    
    // Scrap flag
    markedForScrap: false,
    scrapNotes: null,
    
    // Creator info
    createdById: input.createdById ?? null,
    createdByName: input.createdByName ?? null,
    
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION), requestData);

  // Step 4: Update related records
  if (assignedTechnician) {
    await incrementTechnicianTasks(assignedTechnician.id);
  }
  
  // Increment equipment open request count
  await updateEquipmentRequestCount(equipment.id, 1);

  const newRequest: MaintenanceRequest = {
    id: docRef.id,
    ...requestData,
  } as MaintenanceRequest;

  return { success: true, request: newRequest };
}

/**
 * Update request stage (Kanban drag & drop)
 * Handles the workflow: New → Assigned → In Progress → Repaired → Scrap
 */
export async function updateRequestStage(
  id: string,
  newStage: RequestStage,
  updates?: Partial<UpdateRequestInput>
): Promise<{ success: boolean; error?: string }> {
  const request = await getRequestById(id);
  if (!request) {
    return { success: false, error: "Request not found" };
  }

  const docRef = doc(db, COLLECTION, id);
  const now = new Date().toISOString();
  
  const updateData: Record<string, unknown> = {
    stage: newStage,
    updatedAt: now,
  };

  // Handle stage-specific logic
  switch (newStage) {
    case "in_progress":
      // Record start time
      if (!request.startedAt) {
        updateData.startedAt = now;
      }
      break;
      
    case "repaired":
      // Record completion time and duration
      updateData.completedAt = now;
      if (updates?.duration) {
        updateData.duration = updates.duration;
      } else if (request.startedAt) {
        // Calculate duration in hours
        const start = new Date(request.startedAt);
        const end = new Date(now);
        updateData.duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10;
      }
      updateData.isOverdue = false;
      
      // Decrement technician tasks
      if (request.technicianId) {
        await decrementTechnicianTasks(request.technicianId);
      }
      
      // Decrement equipment open request count and update maintenance history
      await updateEquipmentRequestCount(request.equipmentId, -1);
      await incrementMaintenanceCount(request.equipmentId);
      break;
      
    case "scrap":
      // Scrap Logic: Mark equipment as no longer usable
      updateData.markedForScrap = true;
      updateData.completedAt = now;
      updateData.isOverdue = false;
      
      if (updates?.scrapNotes) {
        updateData.scrapNotes = updates.scrapNotes;
      }
      
      // Mark the equipment as scrapped
      await markEquipmentAsScrapped(request.equipmentId, updates?.scrapNotes);
      
      // Decrement technician tasks if assigned
      if (request.technicianId && request.stage !== "repaired") {
        await decrementTechnicianTasks(request.technicianId);
      }
      
      // Decrement equipment open request count
      await updateEquipmentRequestCount(request.equipmentId, -1);
      break;
  }

  await updateDoc(docRef, updateData);
  return { success: true };
}

/**
 * Assign a request to a specific technician
 * Flow: Manager or technician assigns themselves to the ticket
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

  // Workflow Logic: Only team members should pick up requests for their team
  if (technician.teamId !== request.maintenanceTeamId) {
    return { 
      success: false, 
      error: "Technician must belong to the equipment's maintenance team" 
    };
  }

  // If already assigned to someone else, decrement their task count
  if (request.technicianId && request.technicianId !== technicianId) {
    await decrementTechnicianTasks(request.technicianId);
  }

  const docRef = doc(db, COLLECTION, requestId);
  await updateDoc(docRef, {
    technicianId: technician.id,
    technicianName: technician.name,
    stage: request.stage === "new" ? "assigned" : request.stage,
    updatedAt: new Date().toISOString(),
  });

  // Increment new technician's task count
  if (request.technicianId !== technicianId) {
    await incrementTechnicianTasks(technicianId);
  }

  return { success: true };
}

/**
 * Record hours spent on a request (Duration)
 */
export async function recordDuration(
  requestId: string,
  hours: number
): Promise<void> {
  const docRef = doc(db, COLLECTION, requestId);
  await updateDoc(docRef, {
    duration: hours,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update overdue status for all requests (batch job)
 */
export async function updateOverdueStatus(): Promise<number> {
  const allRequests = await getAllRequests();
  let updatedCount = 0;

  for (const request of allRequests) {
    const shouldBeOverdue = calculateIsOverdue(request.scheduledDate, request.stage);
    
    if (shouldBeOverdue !== request.isOverdue) {
      const docRef = doc(db, COLLECTION, request.id);
      await updateDoc(docRef, {
        isOverdue: shouldBeOverdue,
        updatedAt: new Date().toISOString(),
      });
      updatedCount++;
    }
  }

  return updatedCount;
}

/**
 * Get requests grouped by stage (for Kanban Board)
 */
export async function getRequestsGroupedByStage(): Promise<Record<RequestStage, MaintenanceRequest[]>> {
  const allRequests = await getAllRequests();
  
  const grouped: Record<RequestStage, MaintenanceRequest[]> = {
    new: [],
    assigned: [],
    in_progress: [],
    repaired: [],
    scrap: [],
  };

  for (const request of allRequests) {
    if (grouped[request.stage]) {
      grouped[request.stage].push(request);
    }
  }

  return grouped;
}
