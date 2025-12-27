import { NextRequest, NextResponse } from "next/server";
import { 
  getAllEquipment, 
  createEquipment,
  getEquipmentByDepartment,
  getUsableEquipment,
  searchEquipment
} from "@/lib/db/equipment";
import type { ApiResponse, Equipment, CreateEquipmentInput } from "@/lib/types";

/**
 * GET /api/equipment
 * Fetch all equipment with optional filters
 * Query params:
 *   - department: Filter by department
 *   - usable: Filter by usable status (true/false)
 *   - search: Search by name
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");
    const usable = searchParams.get("usable");
    const search = searchParams.get("search");

    let equipment: Equipment[];

    if (search) {
      equipment = await searchEquipment(search);
    } else if (department) {
      equipment = await getEquipmentByDepartment(department);
    } else if (usable === "true") {
      equipment = await getUsableEquipment();
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
 *   department: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateEquipmentInput = await request.json();

    // Validate required fields
    if (!body.name || !body.department) {
      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: "Missing required fields: name, department" 
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
