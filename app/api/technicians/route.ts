import { NextRequest, NextResponse } from "next/server";
import { 
  getAllTechnicians, 
  getTechniciansByTeam,
  createTechnician 
} from "@/lib/db/technicians";
import type { ApiResponse, Technician, CreateTechnicianInput } from "@/lib/types";

/**
 * GET /api/technicians
 * Fetch all technicians
 * Query params:
 *   - team: Filter by team ID
 *   - active: if "true", only active technicians
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("team");
    const activeOnly = searchParams.get("active") === "true";

    let technicians: Technician[];

    if (teamId) {
      technicians = await getTechniciansByTeam(teamId);
    } else {
      technicians = await getAllTechnicians();
      if (activeOnly) {
        technicians = technicians.filter((t) => t.isActive);
      }
    }

    return NextResponse.json<ApiResponse<Technician[]>>({
      success: true,
      data: technicians,
    });
  } catch (error) {
    console.error("Error fetching technicians:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch technicians" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/technicians
 * Create a new technician
 * 
 * Request body:
 * {
 *   name: string,
 *   email: string,
 *   phone?: string,
 *   teamId: string,
 *   role?: "technician" | "senior_technician" | "team_lead",
 *   skills?: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateTechnicianInput = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.teamId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required fields: name, email, teamId" },
        { status: 400 }
      );
    }

    const technician = await createTechnician(body);

    return NextResponse.json<ApiResponse<Technician>>(
      { success: true, data: technician },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating technician:", error);
    const message = error instanceof Error ? error.message : "Failed to create technician";
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
