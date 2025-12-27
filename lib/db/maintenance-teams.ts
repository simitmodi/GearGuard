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
import type { MaintenanceTeam, CreateMaintenanceTeamInput, Technician } from "@/lib/types";
import { getTechnicianById } from "./technicians";

const COLLECTION = "teams";
const TECH_COLLECTION = "technicians";

/**
 * Create a new maintenance team
 */
export async function createTeam(
  input: CreateMaintenanceTeamInput
): Promise<{ success: boolean; team?: MaintenanceTeam; error?: string }> {
  try {
    ensureDbInitialized();

    const now = new Date().toISOString();
    const teamData = {
      name: input.name,
      description: input.description || null,
      members: input.members || [],
      company: input.company || null,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION), teamData);

    return {
      success: true,
      team: { id: docRef.id, ...teamData } as MaintenanceTeam,
    };
  } catch (error) {
    console.error("Error creating team:", error);
    return { success: false, error: "Failed to create team" };
  }
}

/**
 * Get all teams
 */
export async function getAllTeams(): Promise<MaintenanceTeam[]> {
  ensureDbInitialized();
  const q = query(collection(db, COLLECTION), orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MaintenanceTeam));
}

/**
 * Get team by ID
 */
export async function getTeamById(id: string): Promise<MaintenanceTeam | null> {
  ensureDbInitialized();
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }
  return { id: docSnap.id, ...docSnap.data() } as MaintenanceTeam;
}

/**
 * Add a technician to a team
 */
export async function addMemberToTeam(
  technicianId: string,
  teamId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    ensureDbInitialized();

    // Validate team exists
    const team = await getTeamById(teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    // Validate technician exists
    const technician = await getTechnicianById(technicianId);
    if (!technician) {
      return { success: false, error: "Technician not found" };
    }

    // Update technician
    const docRef = doc(db, TECH_COLLECTION, technicianId);
    await updateDoc(docRef, {
      teamId: team.id,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error adding member to team:", error);
    return { success: false, error: "Failed to add member to team" };
  }
}

/**
 * Get members of a team
 */
export async function getTeamMembers(teamId: string): Promise<Technician[]> {
  ensureDbInitialized();
  const q = query(collection(db, TECH_COLLECTION), where("teamId", "==", teamId));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Technician));
}
