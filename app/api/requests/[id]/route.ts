import { NextRequest, NextResponse } from "next/server";
import { 
  getRequestById, 
  updateRequestStage, 
  assignRequest,
  recordDuration 
} from "@/lib/db/requests";
import type { ApiResponse, MaintenanceRequest, RequestStage } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/requests/[id]
 * Fetch a single request by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const req = await getRequestById(id);

    if (!req) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<MaintenanceRequest>>({
      success: true,
      data: req,
    });
  } catch (error) {
    console.error("Error fetching request:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch request" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/requests/[id]
 * Update a request (stage, assignment, duration, etc.)
 * 
 * Request body:
 * {
 *   stage?: "new" | "assigned" | "in_progress" | "repaired" | "scrap",
 *   technicianId?: string (for manual assignment),
 *   duration?: number (hours spent on repair),
 *   scrapNotes?: string (notes when moving to scrap)
 * }
 * 
 * Workflow:
 * - Stage update handles: New → Assigned → In Progress → Repaired → Scrap
 * - Moving to "repaired" records completion time and duration
 * - Moving to "scrap" marks the equipment as no longer usable
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingRequest = await getRequestById(id);
    if (!existingRequest) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Handle technician assignment
    if (body.technicianId) {
      const assignResult = await assignRequest(id, body.technicianId);
      if (!assignResult.success) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: assignResult.error },
          { status: 400 }
        );
      }
    }

    // Handle duration recording (without stage change)
    if (body.duration && !body.stage) {
      await recordDuration(id, body.duration);
    }

    // Handle stage update (Kanban drag & drop)
    if (body.stage) {
      const validStages: RequestStage[] = ["new", "assigned", "in_progress", "repaired", "scrap"];
      if (!validStages.includes(body.stage)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Invalid stage" },
          { status: 400 }
        );
      }

      const stageResult = await updateRequestStage(id, body.stage, {
        duration: body.duration,
        scrapNotes: body.scrapNotes,
      });

      if (!stageResult.success) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: stageResult.error },
          { status: 400 }
        );
      }
    }

    const updatedRequest = await getRequestById(id);

    return NextResponse.json<ApiResponse<MaintenanceRequest>>({
      success: true,
      data: updatedRequest!,
    });
  } catch (error) {
    console.error("Error updating request:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to update request" },
      { status: 500 }
    );
  }
}
