import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import {
  createAnnouncement,
  listActiveAnnouncements,
  listAllAnnouncements,
} from "@/lib/db/announcements";
import { logEvent } from "@/lib/db/analytics";
import { announcementInputSchema } from "@/lib/validation/announcementSchema";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ["student", "admin"]);
    const includeExpired =
      session.role === "admin" && request.nextUrl.searchParams.get("all") === "true";
    const announcements = includeExpired
      ? await listAllAnnouncements()
      : await listActiveAnnouncements();
    return NextResponse.json({ announcements });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load announcements.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["admin"]);
    const json = await request.json().catch(() => null);
    const parsed = announcementInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const announcement = await createAnnouncement(
      { ...parsed.data, expiresAt: parsed.data.expiresAt || null },
      session.uid
    );

    await logEvent({
      event: "announcement.created",
      entityType: "announcement",
      entityId: announcement.id,
      summary: `Posted announcement: "${announcement.title}"`,
      actorRole: session.role,
      actorUid: session.uid,
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create announcement.");
  }
}
