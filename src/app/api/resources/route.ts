import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { createResource, listResources } from "@/lib/db/resources";
import { getSubjectById } from "@/lib/db/subjects";
import { logEvent } from "@/lib/db/analytics";
import { resourceInputSchema } from "@/lib/validation/resourceSchema";
import { detectLinkType } from "@/lib/resource-type";

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(request, ["student", "admin"]);
    const includeArchived =
      session.role === "admin" && request.nextUrl.searchParams.get("includeArchived") === "true";
    const resources = await listResources({ includeArchived });
    return NextResponse.json({ resources });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load resources.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["admin"]);
    const json = await request.json().catch(() => null);
    const parsed = resourceInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const subject = await getSubjectById(parsed.data.subjectId);
    if (!subject) {
      return NextResponse.json({ error: "Subject not found." }, { status: 400 });
    }

    const resourceType =
      parsed.data.sourceKind === "link"
        ? detectLinkType(parsed.data.externalUrl)
        : parsed.data.resourceType;

    const topicName = parsed.data.topic
      ? (subject.topics.find((t) => t.slug === parsed.data.topic)?.name ?? null)
      : null;

    const resource = await createResource(
      { ...parsed.data, resourceType, subjectName: subject.name, topicName },
      session.uid
    );

    await logEvent({
      event: "resource.created",
      entityType: "resource",
      entityId: resource.id,
      summary: `Added "${resource.title}" to ${resource.subjectName}`,
      actorRole: session.role,
      actorUid: session.uid,
    });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to create resource.");
  }
}
