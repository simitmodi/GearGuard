import { NextRequest, NextResponse } from "next/server";
import { 
  getEquipmentById, 
  updateEquipment,
  scrapEquipment
} from "@/lib/db/equipment";
import { getRequestsByEquipment } from "@/lib/db/requests";
import type { ApiResponse, Equipment, MaintenanceRequest } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/equipment/[id]
 * Fetch a single equipment by ID
 * Query params:
 *   - includeRequests=true: Include all maintenance requests for this equipment
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeRequests = searchParams.get("includeRequests") === "true";

    const equipment = await getEquipmentById(id);

    if (!equipment) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Equipment not found" },
        { status: 404 }
      );
    }

    if (includeRequests) {
      const requests = await getRequestsByEquipment(id);
      
      return NextResponse.json<ApiResponse<{ equipment: Equipment; requests: MaintenanceRequest[] }>>({
        success: true,
        data: {
          equipment,
          requests,
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
 *   name?: string,
 *   department?: string,
 *   scrapNote?: string (if provided, equipment will be scrapped)
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

    // Handle scrap action
    if (body.scrapNote) {
      await scrapEquipment(id, body.scrapNote);
    } else {
      // Handle other field updates
      const updates: Partial<Equipment> = {};
      if (body.name !== undefined) updates.name = body.name;
      if (body.department !== undefined) updates.department = body.department;

      if (Object.keys(updates).length > 0) {
        await updateEquipment(id, updates);
      }
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
