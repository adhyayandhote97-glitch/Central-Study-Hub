import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { getAdminStats } from "@/lib/db/stats";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const stats = await getAdminStats();
    return NextResponse.json({ stats });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load stats.");
  }
}
