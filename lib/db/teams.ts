import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import { CreateTeamInput, ApiResponse, Team } from "@/lib/types";

const TEAMS_COLLECTION = "teams";

/**
 * Create a new Team
 */
export async function createTeam(input: CreateTeamInput): Promise<ApiResponse<{ teamId: string }>> {
  try {
    const docRef = await addDoc(collection(db, TEAMS_COLLECTION), {
      ...input,
      createdAt: new Date().toISOString(),
    });

    return { success: true, data: { teamId: docRef.id } };
  } catch (error) {
    console.error("Error creating team:", error);
    return { success: false, error: "Failed to create team" };
  }
}

/**
 * Get all Teams
 */
export async function getTeams(): Promise<Team[]> {
  try {
    const q = query(collection(db, TEAMS_COLLECTION), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Team));
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
}
