import { NextRequest, NextResponse } from "next/server";
import { 
  getEquipmentById, 
  updateEquipmentStatus,
  updateEquipment,
  markEquipmentAsScrapped
} from "@/lib/db/equipment";
import { getRequestsByEquipment, getOpenRequestsByEquipment } from "@/lib/db/requests";
import type { ApiResponse, Equipment, MaintenanceRequest, EquipmentStatus } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/equipment/[id]
 * Fetch a single equipment by ID
 * Query params:
 *   - includeRequests=true: Include all maintenance requests for this equipment
 *   - openOnly=true: Only include open requests (for Smart Button badge)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeRequests = searchParams.get("includeRequests") === "true";
    const openOnly = searchParams.get("openOnly") === "true";

    const equipment = await getEquipmentById(id);

    if (!equipment) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Equipment not found" },
        { status: 404 }
      );
    }

    // Smart Button: Include maintenance requests if requested
    if (includeRequests) {
      const requests = openOnly 
        ? await getOpenRequestsByEquipment(id)
        : await getRequestsByEquipment(id);
      
      return NextResponse.json<ApiResponse<{ equipment: Equipment; requests: MaintenanceRequest[]; openCount: number }>>({
        success: true,
        data: {
          equipment,
          requests,
          openCount: openOnly ? requests.length : (await getOpenRequestsByEquipment(id)).length,
        },
      });
    }

    return NextResponse.json<ApiResponse<Equipment>>({
      success: true,
      data: equipment,
    });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch equipment" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/equipment/[id]
 * Update equipment
 * 
 * Request body:
 * {
 *   status?: "operational" | "under_maintenance" | "scrapped" | "pending_repair",
 *   scrapNotes?: string (notes when scrapping),
 *   name?: string,
 *   location?: string,
 *   assignedTo?: string,
 *   assignedToId?: string,
 *   notes?: string,
 *   nextMaintenanceDate?: string
 * }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getEquipmentById(id);
    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Equipment not found" },
        { status: 404 }
      );
    }

    // Handle status changes
    if (body.status) {
      const validStatuses: EquipmentStatus[] = ["operational", "under_maintenance", "scrapped", "pending_repair"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Invalid status" },
          { status: 400 }
        );
      }

      // Scrap Logic: Mark equipment as no longer usable
      if (body.status === "scrapped") {
        await markEquipmentAsScrapped(id, body.scrapNotes);
      } else {
        await updateEquipmentStatus(id, body.status);
      }
    }

    // Handle other field updates
    const allowedUpdates: (keyof Equipment)[] = [
      "name", "location", "assignedTo", "assignedToId", 
      "notes", "nextMaintenanceDate", "warrantyExpiryDate"
    ];
    
    const updates: Partial<Equipment> = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length > 0) {
      await updateEquipment(id, updates);
    }

    const updated = await getEquipmentById(id);

    return NextResponse.json<ApiResponse<Equipment>>({
      success: true,
      data: updated!,
    });
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to update equipment" },
      { status: 500 }
    );
  }
}
