import { NextRequest, NextResponse } from "next/server";
import { 
  reportByDepartment, 
  reportByEquipment,
  checkOverdueRequests 
} from "@/lib/db/requests";
import type { ApiResponse, DepartmentReport, EquipmentReport } from "@/lib/types";

/**
 * GET /api/reports
 * Generate reports for maintenance requests
 * Query params:
 *   - type: "department" | "equipment" | "overdue"
 *     - department: Report grouped by department
 *     - equipment: Report grouped by equipment
 *     - overdue: Check and update overdue requests
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Missing required parameter: type" },
        { status: 400 }
      );
    }

    switch (type) {
      case "department": {
        const report = await reportByDepartment();
        return NextResponse.json<ApiResponse<DepartmentReport[]>>({
          success: true,
          data: report,
        });
      }

      case "equipment": {
        const report = await reportByEquipment();
        return NextResponse.json<ApiResponse<EquipmentReport[]>>({
          success: true,
          data: report,
        });
      }

      case "overdue": {
        const updatedCount = await checkOverdueRequests();
        return NextResponse.json<ApiResponse<{ updatedCount: number }>>({
          success: true,
          data: { updatedCount },
        });
      }

      default:
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Invalid report type. Must be 'department', 'equipment', or 'overdue'" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
