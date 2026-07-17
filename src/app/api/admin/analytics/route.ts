import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { getAnalytics } from "@/lib/db/analytics-agg";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const analytics = await getAnalytics();
    return NextResponse.json({ analytics });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load analytics.");
  }
}
