import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  increment,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Equipment, CreateEquipmentInput, EquipmentStatus } from "@/lib/types";
import { getTeamById } from "./teams";
import { getTechnicianById } from "./technicians";

const COLLECTION = "equipment";

/**
 * Get equipment by ID
 */
export async function getEquipmentById(id: string): Promise<Equipment | null> {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as Equipment;
}

/**
 * Get all equipment
 */
export async function getAllEquipment(): Promise<Equipment[]> {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Equipment));
}

/**
 * Get equipment by department
 */
export async function getEquipmentByDepartment(
  department: string
): Promise<Equipment[]> {
  const q = query(
    collection(db, COLLECTION),
    where("department", "==", department)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Equipment));
}

/**
 * Get equipment by category
 */
export async function getEquipmentByCategory(
  category: string
): Promise<Equipment[]> {
  const q = query(
    collection(db, COLLECTION),
    where("category", "==", category)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Equipment));
}

/**
 * Get equipment by assigned employee
 */
export async function getEquipmentByEmployee(
  employeeId: string
): Promise<Equipment[]> {
  const q = query(
    collection(db, COLLECTION),
    where("assignedToId", "==", employeeId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Equipment));
}

/**
 * Get equipment by maintenance team
 */
export async function getEquipmentByTeam(
  teamId: string
): Promise<Equipment[]> {
  const q = query(
    collection(db, COLLECTION),
    where("maintenanceTeamId", "==", teamId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Equipment));
}

/**
 * Check if equipment is usable (not scrapped)
 */
export async function isEquipmentUsable(id: string): Promise<boolean> {
  const equipment = await getEquipmentById(id);
  if (!equipment) return false;
  return equipment.isUsable !== false && equipment.status !== "scrapped";
}

/**
 * Create new equipment
 */
export async function createEquipment(input: CreateEquipmentInput): Promise<Equipment> {
  // Fetch team details
  const team = await getTeamById(input.maintenanceTeamId);
  if (!team) {
    throw new Error("Maintenance team not found");
  }

  // Fetch default technician details if provided
  let defaultTechnicianName: string | undefined;
  if (input.defaultTechnicianId) {
    const technician = await getTechnicianById(input.defaultTechnicianId);
    defaultTechnicianName = technician?.name;
  }

  const now = new Date().toISOString();
  const equipmentData = {
    name: input.name,
    serialNumber: input.serialNumber,
    category: input.category,
    department: input.department,
    location: input.location,
    assignedTo: input.assignedTo ?? null,
    assignedToId: input.assignedToId ?? null,
    purchaseDate: input.purchaseDate,
    warrantyExpiryDate: input.warrantyExpiryDate ?? null,
    purchaseCost: input.purchaseCost ?? null,
    vendor: input.vendor ?? null,
    maintenanceTeamId: input.maintenanceTeamId,
    maintenanceTeam: team.name,
    defaultTechnicianId: input.defaultTechnicianId ?? null,
    defaultTechnicianName: defaultTechnicianName ?? null,
    isUsable: true,
    status: "operational" as EquipmentStatus,
    lastMaintenanceDate: null,
    nextMaintenanceDate: null,
    totalMaintenanceCount: 0,
    openRequestCount: 0,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION), equipmentData);

  return {
    id: docRef.id,
    ...equipmentData,
  } as Equipment;
}

/**
 * Update equipment status
 */
export async function updateEquipmentStatus(
  id: string,
  status: EquipmentStatus
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    status,
    isUsable: status !== "scrapped",
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Mark equipment as scrapped
 */
export async function markEquipmentAsScrapped(id: string, notes?: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    status: "scrapped",
    isUsable: false,
    notes: notes ? `SCRAPPED: ${notes}` : "Equipment marked for scrap",
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update equipment open request count
 */
export async function updateEquipmentRequestCount(
  id: string,
  delta: number
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    openRequestCount: increment(delta),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Increment total maintenance count
 */
export async function incrementMaintenanceCount(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    totalMaintenanceCount: increment(1),
    lastMaintenanceDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update equipment details
 */
export async function updateEquipment(
  id: string,
  updates: Partial<Equipment>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Search equipment by name or serial number
 */
export async function searchEquipment(searchTerm: string): Promise<Equipment[]> {
  // Firestore doesn't support full-text search, so we fetch all and filter
  const allEquipment = await getAllEquipment();
  const lowerSearch = searchTerm.toLowerCase();
  
  return allEquipment.filter(
    (eq) =>
      eq.name.toLowerCase().includes(lowerSearch) ||
      eq.serialNumber.toLowerCase().includes(lowerSearch)
  );
}
