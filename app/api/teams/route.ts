import { NextRequest, NextResponse } from "next/server";
import { 
  getAllTeams, 
  getActiveTeams, 
  createTeam,
  getTeamsBySpecialization 
} from "@/lib/db/teams";
import type { ApiResponse, MaintenanceTeam, CreateTeamInput } from "@/lib/types";

/**
 * GET /api/teams
 * Fetch all maintenance teams
 * Query params:
 *   - active=true: Only return active teams
 *   - specialization: Filter by specialization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const specialization = searchParams.get("specialization");

    let teams: MaintenanceTeam[];

    if (specialization) {
      teams = await getTeamsBySpecialization(specialization);
    } else if (activeOnly) {
      teams = await getActiveTeams();
    } else {
      teams = await getAllTeams();
    }

    return NextResponse.json<ApiResponse<MaintenanceTeam[]>>({
      success: true,
      data: teams,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams
 * Create a new maintenance team
 * 
 * Request body:
 * {
 *   name: string,
 *   description?: string,
 *   specialization: "mechanics" | "electricians" | "it-support" | "hvac" | "plumbing" | "general" | "external-vendor"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateTeamInput = await request.json();

    // Validate required fields
    if (!body.name || !body.specialization) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required fields: name, specialization" },
        { status: 400 }
      );
    }

    // Validate specialization
    const validSpecializations = ["mechanics", "electricians", "it-support", "hvac", "plumbing", "general", "external-vendor"];
    if (!validSpecializations.includes(body.specialization)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: `Invalid specialization. Must be one of: ${validSpecializations.join(", ")}` },
        { status: 400 }
      );
    }

    const team = await createTeam(body);

    return NextResponse.json<ApiResponse<MaintenanceTeam>>(
      { success: true, data: team },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to create team" },
      { status: 500 }
    );
  }
}
