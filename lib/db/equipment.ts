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
import type { Equipment, CreateEquipmentInput } from "@/lib/types";

const COLLECTION = "equipment";

/**
 * Get equipment by ID
 */
export async function getEquipmentById(id: string): Promise<Equipment | null> {
  ensureDbInitialized();
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
  ensureDbInitialized();
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
 * Get usable equipment only
 */
export async function getUsableEquipment(): Promise<Equipment[]> {
  const q = query(
    collection(db, COLLECTION),
    where("isUsable", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Equipment));
}

/**
 * Validate equipment - check if equipment exists and is usable
 * Returns the equipment if valid, throws error otherwise
 */
export async function validateEquipment(id: string): Promise<Equipment> {
  const equipment = await getEquipmentById(id);

  if (!equipment) {
    throw new Error("Equipment not found");
  }

  if (!equipment.isUsable) {
    throw new Error("Equipment is not usable (scrapped)");
  }

  return equipment;
}

/**
 * Create new equipment
 */
export async function createEquipment(input: CreateEquipmentInput): Promise<Equipment> {
  ensureDbInitialized();

  // Input validation
  if (!input.name?.trim()) {
    throw new Error("Equipment name is required");
  }
  if (!input.department?.trim()) {
    throw new Error("Department is required");
  }

  const now = new Date().toISOString();
  const equipmentData = {
    name: input.name.trim(),
    department: input.department.trim(),
    isUsable: true,
    scrapNote: null,
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
 * Mark equipment as scrapped
 */
export async function scrapEquipment(id: string, scrapNote: string): Promise<void> {
  ensureDbInitialized();

  if (!scrapNote?.trim()) {
    throw new Error("Scrap note is required");
  }

  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    isUsable: false,
    scrapNote: scrapNote.trim(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update equipment details
 */
export async function updateEquipment(
  id: string,
  updates: Partial<Omit<Equipment, "id" | "createdAt">>
): Promise<void> {
  ensureDbInitialized();
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Search equipment by name
 */
export async function searchEquipment(searchTerm: string): Promise<Equipment[]> {
  const allEquipment = await getAllEquipment();
  const lowerSearch = searchTerm.toLowerCase();

  return allEquipment.filter(
    (eq) => eq.name.toLowerCase().includes(lowerSearch)
  );
}
