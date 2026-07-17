import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { createTicket, listTickets } from "@/lib/db/tickets";
import { getSubjectById } from "@/lib/db/subjects";
import { logEvent } from "@/lib/db/analytics";
import { ticketInputSchema } from "@/lib/validation/ticketSchema";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const tickets = await listTickets();
    return NextResponse.json({ tickets });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load tickets.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireRole(request, ["student", "admin"]);
    const json = await request.json().catch(() => null);
    const parsed = ticketInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    let subjectName: string | null = null;
    if (parsed.data.subjectId) {
      const subject = await getSubjectById(parsed.data.subjectId);
      subjectName = subject?.name ?? null;
    }

    const ticket = await createTicket({ ...parsed.data, subjectName }, session.uid);

    await logEvent({
      event: "ticket.created",
      entityType: "ticket",
      entityId: ticket.id,
      summary: `New ${ticket.type.replace(/-/g, " ")} ticket: "${ticket.title}"`,
      actorRole: session.role,
      actorUid: session.uid,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Failed to submit ticket.");
  }
}
