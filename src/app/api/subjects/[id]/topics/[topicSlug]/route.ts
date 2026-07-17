import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { removeTopic } from "@/lib/db/subjects";

interface RouteParams {
  params: Promise<{ id: string; topicSlug: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(request, ["admin"]);
    const { id, topicSlug } = await params;
    const subject = await removeTopic(id, topicSlug);
    if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 404 });
    return NextResponse.json({ subject });
  } catch (error) {
    return apiErrorResponse(error, "Failed to remove topic.");
  }
}
