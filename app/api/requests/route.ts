import { NextRequest, NextResponse } from "next/server";
import { 
  createRequest, 
  getAllRequests, 
  getRequestsGroupedByStage,
  getPreventiveRequests 
} from "@/lib/db/requests";
import type { CreateRequestInput, ApiResponse, MaintenanceRequest, RequestStage } from "@/lib/types";

/**
 * GET /api/requests
 * Fetch all maintenance requests
 * Query params:
 *   - grouped=true: Return requests grouped by stage (for Kanban)
 *   - type=preventive: Return only preventive requests (for Calendar)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const grouped = searchParams.get("grouped") === "true";
    const type = searchParams.get("type");

    if (grouped) {
      const groupedRequests = await getRequestsGroupedByStage();
      return NextResponse.json<ApiResponse<Record<RequestStage, MaintenanceRequest[]>>>({
        success: true,
        data: groupedRequests,
      });
    }

    if (type === "preventive") {
      const preventiveRequests = await getPreventiveRequests();
      return NextResponse.json<ApiResponse<MaintenanceRequest[]>>({
        success: true,
        data: preventiveRequests,
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
 * Create a new maintenance request with auto-fill and auto-assignment
 * 
 * Request body:
 * {
 *   subject: string,        // What is wrong? (e.g., "Leaking Oil")
 *   description: string,
 *   equipmentId: string,    // System auto-fills category, team from equipment
 *   type: "corrective" | "preventive",
 *   priority?: "low" | "medium" | "high" | "critical",
 *   scheduledDate?: string, // Required for preventive maintenance
 *   createdById?: string,
 *   createdByName?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateRequestInput = await request.json();

    // Validate required fields
    if (!body.subject || !body.equipmentId || !body.type) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required fields: subject, equipmentId, type" },
        { status: 400 }
      );
    }

    // Validate type enum
    if (!["corrective", "preventive"].includes(body.type)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid type. Must be 'corrective' or 'preventive'" },
        { status: 400 }
      );
    }

    // For preventive maintenance, scheduledDate should be provided
    if (body.type === "preventive" && !body.scheduledDate) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Scheduled date is required for preventive maintenance" },
        { status: 400 }
      );
    }

    // Create the request with auto-fill and auto-assignment
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
