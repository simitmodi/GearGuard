import { NextRequest, NextResponse } from "next/server";
import { 
  getRequestById, 
  updateRequestStatus, 
  assignRequest 
} from "@/lib/db/requests";
import type { ApiResponse, MaintenanceRequest, RequestStatus } from "@/lib/types";

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
 * Update a request (status, assignment)
 * 
 * Request body:
 * {
 *   status?: "NEW" | "IN_PROGRESS" | "REPAIRED" | "SCRAP",
 *   technicianId?: string (for manual assignment),
 *   scrapNote?: string (required when status is SCRAP)
 * }
 * 
 * Workflow:
 * - Status flow: NEW → IN_PROGRESS → REPAIRED or SCRAP
 * - Moving to "SCRAP" marks the equipment as no longer usable
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

    // Handle status update (Kanban drag & drop)
    if (body.status) {
      const validStatuses: RequestStatus[] = ["NEW", "IN_PROGRESS", "REPAIRED", "SCRAP"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Invalid status. Must be NEW, IN_PROGRESS, REPAIRED, or SCRAP" },
          { status: 400 }
        );
      }

      const statusResult = await updateRequestStatus(id, body.status, body.scrapNote);

      if (!statusResult.success) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: statusResult.error },
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
