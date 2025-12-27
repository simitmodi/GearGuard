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
import { ensureDbInitialized } from "@/lib/db-utils";
import type { Technician, CreateTechnicianInput } from "@/lib/types";

const COLLECTION = "technicians";

/**
 * Get technician by ID
 */
export async function getTechnicianById(id: string): Promise<Technician | null> {
  ensureDbInitialized();
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as Technician;
}

/**
 * Get all technicians
 */
export async function getAllTechnicians(): Promise<Technician[]> {
  ensureDbInitialized();
  const q = query(collection(db, COLLECTION), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Technician));
}

/**
 * Get active technicians only
 */
export async function getActiveTechnicians(): Promise<Technician[]> {
  const q = query(
    collection(db, COLLECTION),
    where("isActive", "==", true),
    orderBy("name", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Technician));
}

/**
 * Get technicians by department
 */
export async function getTechniciansByDepartment(department: string): Promise<Technician[]> {
  const q = query(
    collection(db, COLLECTION),
    where("department", "==", department),
    where("isActive", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Technician));
}

/**
 * Get technicians by team
 */
export async function getTechniciansByTeam(teamId: string): Promise<Technician[]> {
  const q = query(
    collection(db, COLLECTION),
    where("teamId", "==", teamId),
    where("isActive", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Technician));
}

/**
 * Find the technician with the minimum active tasks in a department
 * Used for auto-assignment of maintenance requests
 */
/**
 * Find the technician with the minimum active tasks in a department
 * Used for auto-assignment of maintenance requests
 */
export async function findTechnicianWithMinTasks(
  department: string
): Promise<Technician | null> {
  const technicians = await getTechniciansByDepartment(department);

  if (technicians.length === 0) {
    return null;
  }

  // Sort by activeTasks ascending and pick the first one
  return technicians.reduce((min, tech) =>
    tech.activeTasks < min.activeTasks ? tech : min
  );
}

/**
 * Find the technician with the minimum active tasks in a team
 */
export async function findTechnicianWithMinTasksByTeam(
  teamId: string
): Promise<Technician | null> {
  const technicians = await getTechniciansByTeam(teamId);

  if (technicians.length === 0) {
    return null;
  }

  return technicians.reduce((min, tech) =>
    tech.activeTasks < min.activeTasks ? tech : min
  );
}

/**
 * Create a new technician
 */
export async function createTechnician(input: CreateTechnicianInput): Promise<Technician> {
  ensureDbInitialized();

  // Input validation
  if (!input.name?.trim()) {
    throw new Error("Technician name is required");
  }
  if (!input.department?.trim()) {
    throw new Error("Department is required");
  }

  const now = new Date().toISOString();
  const technicianData = {
    name: input.name.trim(),
    department: input.department.trim(),
    email: input.email?.trim() || null,
    teamId: input.teamId || null,
    activeTasks: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION), technicianData);

  return {
    id: docRef.id,
    ...technicianData,
  } as Technician;
}

/**
 * Increment active tasks for a technician
 */
export async function incrementTechnicianTasks(id: string): Promise<void> {
  ensureDbInitialized();
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    activeTasks: increment(1),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Decrement active tasks for a technician
 */
export async function decrementTechnicianTasks(id: string): Promise<void> {
  ensureDbInitialized();
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    activeTasks: increment(-1),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update technician status (active/inactive)
 */
export async function updateTechnicianStatus(id: string, isActive: boolean): Promise<void> {
  ensureDbInitialized();
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    isActive,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update technician details
 */
export async function updateTechnician(
  id: string,
  updates: Partial<Omit<Technician, "id" | "createdAt">>
): Promise<void> {
  ensureDbInitialized();
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}
