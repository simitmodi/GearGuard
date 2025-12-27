import { NextRequest, NextResponse } from "next/server";
import { getTeamById, updateTeam, updateTeamStatus } from "@/lib/db/teams";
import { getTechniciansByTeam } from "@/lib/db/technicians";
import type { ApiResponse, MaintenanceTeam, Technician } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/teams/[id]
 * Fetch a single team by ID
 * Query params:
 *   - includeMembers=true: Include team members (technicians)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeMembers = searchParams.get("includeMembers") === "true";

    const team = await getTeamById(id);

    if (!team) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    if (includeMembers) {
      const members = await getTechniciansByTeam(id);
      return NextResponse.json<ApiResponse<{ team: MaintenanceTeam; members: Technician[] }>>({
        success: true,
        data: { team, members },
      });
    }

    return NextResponse.json<ApiResponse<MaintenanceTeam>>({
      success: true,
      data: team,
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teams/[id]
 * Update a team
 * 
 * Request body:
 * {
 *   name?: string,
 *   description?: string,
 *   specialization?: string,
 *   isActive?: boolean
 * }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getTeamById(id);
    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // Handle status update
    if (body.isActive !== undefined) {
      await updateTeamStatus(id, body.isActive);
    }

    // Handle other updates
    const updates: Partial<Pick<MaintenanceTeam, "name" | "description" | "specialization">> = {};
    if (body.name) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.specialization) updates.specialization = body.specialization;

    if (Object.keys(updates).length > 0) {
      await updateTeam(id, updates);
    }

    const updated = await getTeamById(id);

    return NextResponse.json<ApiResponse<MaintenanceTeam>>({
      success: true,
      data: updated!,
    });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to update team" },
      { status: 500 }
    );
  }
}
