import { NextRequest, NextResponse } from "next/server";
import { 
  createRequest, 
  getAllRequests, 
  getKanbanBoard,
  getCalendarData 
} from "@/lib/db/requests";
import type { CreateRequestInput, ApiResponse, MaintenanceRequest, KanbanBoard, CalendarEvent } from "@/lib/types";

/**
 * GET /api/requests
 * Fetch all maintenance requests
 * Query params:
 *   - kanban=true: Return requests grouped by status (for Kanban board)
 *   - calendar=true: Return calendar events (for Calendar view)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kanban = searchParams.get("kanban") === "true";
    const calendar = searchParams.get("calendar") === "true";

    if (kanban) {
      const board = await getKanbanBoard();
      return NextResponse.json<ApiResponse<KanbanBoard>>({
        success: true,
        data: board,
      });
    }

    if (calendar) {
      const events = await getCalendarData();
      return NextResponse.json<ApiResponse<CalendarEvent[]>>({
        success: true,
        data: events,
      });
    }

    const requests = await getAllRequests();
    return NextResponse.json<ApiResponse<MaintenanceRequest[]>>({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/requests
 * Create a new maintenance request with auto-assignment
 * 
 * Request body:
 * {
 *   title: string,          // What is the issue?
 *   equipmentId: string,    // Equipment being serviced
 *   type: "CORRECTIVE" | "PREVENTIVE",
 *   scheduledDate?: string  // Required for PREVENTIVE type
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateRequestInput = await request.json();

    // Validate required fields
    if (!body.title || !body.equipmentId || !body.type) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required fields: title, equipmentId, type" },
        { status: 400 }
      );
    }

    // Validate type enum
    if (!["CORRECTIVE", "PREVENTIVE"].includes(body.type)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid type. Must be 'CORRECTIVE' or 'PREVENTIVE'" },
        { status: 400 }
      );
    }

    // For preventive maintenance, scheduledDate should be provided
    if (body.type === "PREVENTIVE" && !body.scheduledDate) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Scheduled date is required for preventive maintenance" },
        { status: 400 }
      );
    }

    // Create the request with auto-assignment
    const result = await createRequest(body);

    if (!result.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse<MaintenanceRequest>>(
      { success: true, data: result.request },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to create request" },
      { status: 500 }
    );
  }
}
