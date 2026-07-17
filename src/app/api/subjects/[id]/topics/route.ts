import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { addTopic } from "@/lib/db/subjects";
import { logEvent } from "@/lib/db/analytics";
import { topicInputSchema } from "@/lib/validation/subjectSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ["admin"]);
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = topicInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }
    const subject = await addTopic(id, parsed.data.name);
    if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 404 });

    await logEvent({
      event: "subject.updated",
      entityType: "subject",
      entityId: id,
      summary: `Added topic "${parsed.data.name}" to ${subject.name}`,
      actorRole: session.role,
      actorUid: session.uid,
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to add topic.");
  }
}
