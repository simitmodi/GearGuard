import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ensureDbInitialized } from "@/lib/db-utils";
import type { UserProfile, UserRole } from "@/lib/types";

const COLLECTION = "users";

/**
 * Get user profile by Auth UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    ensureDbInitialized();
    const docRef = doc(db, COLLECTION, uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        role: (data.role as string)?.toUpperCase() as UserRole
    } as UserProfile;
}

/**
 * Create or Update user profile
 * typically called after signup
 */
export async function createUserProfile(
    uid: string,
    data: {
        name: string;
        email: string;
        role: UserRole;
        departmentId?: string;
        technicianId?: string;
    }
): Promise<void> {
    ensureDbInitialized();
    const now = new Date().toISOString();

    const userProfile: UserProfile = {
        id: uid,
        ...data,
        createdAt: now,
        updatedAt: now,
    };

    await setDoc(doc(db, COLLECTION, uid), userProfile);
}

/**
 * Update user role (Manager only function ideally)
 */
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
    const docRef = doc(db, COLLECTION, uid);
    await updateDoc(docRef, {
        role,
        updatedAt: new Date().toISOString(),
    });
}
