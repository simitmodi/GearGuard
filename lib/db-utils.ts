import { db } from "./firebase";

/**
 * Check if Firestore database is initialized
 * Throws a clear error if not initialized
 */
export function ensureDbInitialized(): void {
    if (!db) {
        throw new Error(
            "Firestore database is not initialized. Please check your Firebase configuration in .env.local"
        );
    }
}

/**
 * Safely execute a database operation with error handling
 * Returns a result object with success/error information
 */
export async function safeDbOperation<T>(
    operation: () => Promise<T>,
    operationName: string
): Promise<{ success: true; data: T } | { success: false; error: string }> {
    try {
        ensureDbInitialized();
        const data = await operation();
        return { success: true, data };
    } catch (error) {
        console.error(`Database operation failed [${operationName}]:`, error);
        const errorMessage =
            error instanceof Error ? error.message : "Unknown database error";
        return { success: false, error: errorMessage };
    }
}
