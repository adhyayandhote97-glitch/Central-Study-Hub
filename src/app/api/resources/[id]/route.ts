import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { deleteResource, getResourceById, updateResource } from "@/lib/db/resources";
import { getSubjectById } from "@/lib/db/subjects";
import { logEvent } from "@/lib/db/analytics";
import { resourcePatchSchema } from "@/lib/validation/resourceSchema";
import type { AnalyticsEventType } from "@/types/analytics";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(request, ["student", "admin"]);
    const { id } = await params;
    const resource = await getResourceById(id);
    if (!resource) return NextResponse.json({ error: "Resource not found." }, { status: 404 });
    return NextResponse.json({ resource });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load resource.");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ["admin"]);
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = resourcePatchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const patch: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.subjectId || parsed.data.topic !== undefined) {
      const effectiveSubjectId = parsed.data.subjectId ?? (await getResourceById(id))?.subjectId;
      const subject = effectiveSubjectId ? await getSubjectById(effectiveSubjectId) : null;
      if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 400 });
      if (parsed.data.subjectId) patch.subjectName = subject.name;
      if (parsed.data.topic !== undefined) {
        patch.topicName = parsed.data.topic
          ? (subject.topics.find((t) => t.slug === parsed.data.topic)?.name ?? null)
          : null;
      }
    }

    const resource = await updateResource(id, patch);
    if (!resource) return NextResponse.json({ error: "Resource not found." }, { status: 404 });

    let event: AnalyticsEventType = "resource.updated";
    let summary = `Edited "${resource.title}"`;
    if (parsed.data.archived !== undefined) {
      event = "resource.archived";
      summary = `${parsed.data.archived ? "Archived" : "Restored"} "${resource.title}"`;
    } else if (parsed.data.featured !== undefined) {
      event = "resource.featured";
      summary = `${parsed.data.featured ? "Featured" : "Unfeatured"} "${resource.title}"`;
    } else if (parsed.data.pinned !== undefined) {
      event = "resource.pinned";
      summary = `${parsed.data.pinned ? "Pinned" : "Unpinned"} "${resource.title}"`;
    }

    await logEvent({
      event,
      entityType: "resource",
      entityId: id,
      summary,
      actorRole: session.role,
      actorUid: session.uid,
    });

    return NextResponse.json({ resource });
  } catch (error) {
    return apiErrorResponse(error, "Failed to update resource.");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ["admin"]);
    const { id } = await params;
    const resource = await getResourceById(id);
    const deleted = await deleteResource(id);
    if (!deleted) return NextResponse.json({ error: "Resource not found." }, { status: 404 });

    await logEvent({
      event: "resource.deleted",
      entityType: "resource",
      entityId: id,
      summary: `Deleted "${resource?.title ?? id}"`,
      actorRole: session.role,
      actorUid: session.uid,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete resource.");
  }
}
