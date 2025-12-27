import { NextRequest, NextResponse } from "next/server";
import { 
  getAllEquipment, 
  createEquipment,
  getEquipmentByDepartment,
  getEquipmentByCategory,
  getEquipmentByTeam,
  searchEquipment
} from "@/lib/db/equipment";
import type { ApiResponse, Equipment, CreateEquipmentInput } from "@/lib/types";

/**
 * GET /api/equipment
 * Fetch all equipment with optional filters
 * Query params:
 *   - department: Filter by department
 *   - category: Filter by category
 *   - team: Filter by maintenance team ID
 *   - search: Search by name or serial number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const category = searchParams.get("category");
    const teamId = searchParams.get("team");
    const search = searchParams.get("search");

    let equipment: Equipment[];

    if (search) {
      equipment = await searchEquipment(search);
    } else if (department) {
      equipment = await getEquipmentByDepartment(department);
    } else if (category) {
      equipment = await getEquipmentByCategory(category);
    } else if (teamId) {
      equipment = await getEquipmentByTeam(teamId);
    } else {
      equipment = await getAllEquipment();
    }

    return NextResponse.json<ApiResponse<Equipment[]>>({
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
 * POST /api/equipment
 * Create new equipment
 * 
 * Request body:
 * {
 *   name: string,
 *   serialNumber: string,
 *   category: string,
 *   department: string,
 *   location: string,
 *   assignedTo?: string,
 *   assignedToId?: string,
 *   purchaseDate: string,
 *   warrantyExpiryDate?: string,
 *   purchaseCost?: number,
 *   vendor?: string,
 *   maintenanceTeamId: string,
 *   defaultTechnicianId?: string,
 *   notes?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateEquipmentInput = await request.json();

    // Validate required fields
    if (!body.name || !body.serialNumber || !body.category || 
        !body.department || !body.location || !body.purchaseDate || 
        !body.maintenanceTeamId) {
      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: "Missing required fields: name, serialNumber, category, department, location, purchaseDate, maintenanceTeamId" 
        },
        { status: 400 }
      );
    }

    const equipment = await createEquipment(body);

    return NextResponse.json<ApiResponse<Equipment>>(
      { success: true, data: equipment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating equipment:", error);
    const message = error instanceof Error ? error.message : "Failed to create equipment";
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
