import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { deleteAnnouncement, updateAnnouncement } from "@/lib/db/announcements";
import { logEvent } from "@/lib/db/analytics";
import { announcementPatchSchema } from "@/lib/validation/announcementSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ["admin"]);
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = announcementPatchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const announcement = await updateAnnouncement(id, {
      ...parsed.data,
      expiresAt: parsed.data.expiresAt === "" ? null : parsed.data.expiresAt,
    });
    if (!announcement) return NextResponse.json({ error: "Announcement not found." }, { status: 404 });

    await logEvent({
      event: "announcement.updated",
      entityType: "announcement",
      entityId: id,
      summary: `Updated announcement: "${announcement.title}"`,
      actorRole: session.role,
      actorUid: session.uid,
    });

    return NextResponse.json({ announcement });
  } catch (error) {
    return apiErrorResponse(error, "Failed to update announcement.");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ["admin"]);
    const { id } = await params;
    const deleted = await deleteAnnouncement(id);
    if (!deleted) return NextResponse.json({ error: "Announcement not found." }, { status: 404 });

    await logEvent({
      event: "announcement.deleted",
      entityType: "announcement",
      entityId: id,
      summary: "Deleted an announcement",
      actorRole: session.role,
      actorUid: session.uid,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete announcement.");
  }
}
