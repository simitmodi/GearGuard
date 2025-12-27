import { NextRequest, NextResponse } from "next/server";
import { 
  getTechnicianById, 
  updateTechnician, 
  updateTechnicianStatus,
  reassignTechnicianToTeam
} from "@/lib/db/technicians";
import { getRequestsByTechnician } from "@/lib/db/requests";
import type { ApiResponse, Technician, MaintenanceRequest } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/technicians/[id]
 * Fetch a single technician by ID
 * Query params:
 *   - includeRequests=true: Include assigned maintenance requests
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeRequests = searchParams.get("includeRequests") === "true";

    const technician = await getTechnicianById(id);

    if (!technician) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Technician not found" },
        { status: 404 }
      );
    }

    if (includeRequests) {
      const requests = await getRequestsByTechnician(id);
      return NextResponse.json<ApiResponse<{ technician: Technician; requests: MaintenanceRequest[] }>>({
        success: true,
        data: { technician, requests },
      });
    }

    return NextResponse.json<ApiResponse<Technician>>({
      success: true,
      data: technician,
    });
  } catch (error) {
    console.error("Error fetching technician:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch technician" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/technicians/[id]
 * Update a technician
 * 
 * Request body:
 * {
 *   name?: string,
 *   email?: string,
 *   phone?: string,
 *   role?: "technician" | "senior_technician" | "team_lead",
 *   skills?: string[],
 *   isActive?: boolean,
 *   teamId?: string (to reassign to a different team)
 * }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getTechnicianById(id);
    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Technician not found" },
        { status: 404 }
      );
    }

    // Handle status update
    if (body.isActive !== undefined) {
      await updateTechnicianStatus(id, body.isActive);
    }

    // Handle team reassignment
    if (body.teamId && body.teamId !== existing.teamId) {
      await reassignTechnicianToTeam(id, body.teamId);
    }

    // Handle other updates
    const updates: Partial<Pick<Technician, "name" | "email" | "phone" | "role" | "skills">> = {};
    if (body.name) updates.name = body.name;
    if (body.email) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.role) updates.role = body.role;
    if (body.skills) updates.skills = body.skills;

    if (Object.keys(updates).length > 0) {
      await updateTechnician(id, updates);
    }

    const updated = await getTechnicianById(id);

    return NextResponse.json<ApiResponse<Technician>>({
      success: true,
      data: updated!,
    });
  } catch (error) {
    console.error("Error updating technician:", error);
    const message = error instanceof Error ? error.message : "Failed to update technician";
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
