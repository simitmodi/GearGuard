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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MaintenanceTeam, CreateTeamInput } from "@/lib/types";

const COLLECTION = "maintenanceTeams";

/**
 * Get team by ID
 */
export async function getTeamById(id: string): Promise<MaintenanceTeam | null> {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as MaintenanceTeam;
}

/**
 * Get all maintenance teams
 */
export async function getAllTeams(): Promise<MaintenanceTeam[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MaintenanceTeam));
}

/**
 * Get active teams only
 */
export async function getActiveTeams(): Promise<MaintenanceTeam[]> {
  const q = query(
    collection(db, COLLECTION),
    where("isActive", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MaintenanceTeam));
}

/**
 * Get teams by specialization
 */
export async function getTeamsBySpecialization(
  specialization: string
): Promise<MaintenanceTeam[]> {
  const q = query(
    collection(db, COLLECTION),
    where("specialization", "==", specialization),
    where("isActive", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MaintenanceTeam));
}

/**
 * Create a new maintenance team
 */
export async function createTeam(input: CreateTeamInput): Promise<MaintenanceTeam> {
  const now = new Date().toISOString();
  const teamData = {
    name: input.name,
    description: input.description ?? "",
    specialization: input.specialization,
    isActive: true,
    memberCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION), teamData);
  
  return {
    id: docRef.id,
    ...teamData,
  } as MaintenanceTeam;
}

/**
 * Update team member count
 */
export async function updateTeamMemberCount(teamId: string, delta: number): Promise<void> {
  const docRef = doc(db, COLLECTION, teamId);
  await updateDoc(docRef, {
    memberCount: increment(delta),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update team status
 */
export async function updateTeamStatus(teamId: string, isActive: boolean): Promise<void> {
  const docRef = doc(db, COLLECTION, teamId);
  await updateDoc(docRef, {
    isActive,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update team details
 */
export async function updateTeam(
  teamId: string, 
  updates: Partial<Pick<MaintenanceTeam, "name" | "description" | "specialization">>
): Promise<void> {
  const docRef = doc(db, COLLECTION, teamId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}
