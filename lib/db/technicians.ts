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
import type { Technician, CreateTechnicianInput } from "@/lib/types";
import { getTeamById, updateTeamMemberCount } from "./teams";

const COLLECTION = "technicians";

/**
 * Get technician by ID
 */
export async function getTechnicianById(id: string): Promise<Technician | null> {
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
  const q = query(collection(db, COLLECTION), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Technician));
}

/**
 * Get technicians by team ID
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
 * Get active technicians by team
 * Workflow Logic: Only team members can pick up requests for their team
 */
export async function getActiveTechniciansByTeam(
  teamId: string
): Promise<Technician[]> {
  const q = query(
    collection(db, COLLECTION),
    where("teamId", "==", teamId),
    where("isActive", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Technician));
}

/**
 * Find the technician with the minimum active tasks in a team
 * Used for auto-assignment
 */
export async function findTechnicianWithMinTasks(
  teamId: string
): Promise<Technician | null> {
  const technicians = await getActiveTechniciansByTeam(teamId);

  if (technicians.length === 0) {
    return null;
  }

  // Sort by activeTasks ascending and pick the first one
  return technicians.reduce((min, tech) =>
    (tech.activeTasks ?? 0) < (min.activeTasks ?? 0) ? tech : min
  );
}

/**
 * Create a new technician
 */
export async function createTechnician(input: CreateTechnicianInput): Promise<Technician> {
  // Validate team exists
  const team = await getTeamById(input.teamId);
  if (!team) {
    throw new Error("Team not found");
  }

  const now = new Date().toISOString();
  const technicianData = {
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    teamId: input.teamId,
    teamName: team.name,
    role: input.role ?? "technician",
    isActive: true,
    activeTasks: 0,
    completedTasks: 0,
    skills: input.skills ?? [],
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION), technicianData);

  // Update team member count
  await updateTeamMemberCount(input.teamId, 1);

  return {
    id: docRef.id,
    ...technicianData,
  } as Technician;
}

/**
 * Increment active tasks for a technician
 */
export async function incrementTechnicianTasks(id: string): Promise<void> {
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
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    activeTasks: increment(-1),
    completedTasks: increment(1),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update technician status
 */
export async function updateTechnicianStatus(id: string, isActive: boolean): Promise<void> {
  const technician = await getTechnicianById(id);
  if (!technician) return;

  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    isActive,
    updatedAt: new Date().toISOString(),
  });

  // Update team member count
  await updateTeamMemberCount(technician.teamId, isActive ? 1 : -1);
}

/**
 * Update technician details
 */
export async function updateTechnician(
  id: string,
  updates: Partial<Pick<Technician, "name" | "email" | "phone" | "skills" | "role">>
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Reassign technician to new team
 */
export async function reassignTechnicianToTeam(
  technicianId: string,
  newTeamId: string
): Promise<void> {
  const technician = await getTechnicianById(technicianId);
  if (!technician) {
    throw new Error("Technician not found");
  }

  const newTeam = await getTeamById(newTeamId);
  if (!newTeam) {
    throw new Error("New team not found");
  }

  // Update team member counts
  await updateTeamMemberCount(technician.teamId, -1);
  await updateTeamMemberCount(newTeamId, 1);

  // Update technician
  const docRef = doc(db, COLLECTION, technicianId);
  await updateDoc(docRef, {
    teamId: newTeamId,
    teamName: newTeam.name,
    updatedAt: new Date().toISOString(),
  });
}
