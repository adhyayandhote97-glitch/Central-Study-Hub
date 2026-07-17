import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { listRecentEvents } from "@/lib/db/analytics";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 20;
    const events = await listRecentEvents(limit);
    return NextResponse.json({ events });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load activity.");
  }
}
