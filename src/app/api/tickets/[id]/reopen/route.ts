import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { getTicketById, updateTicket } from "@/lib/db/tickets";
import { logEvent } from "@/lib/db/analytics";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ["student", "admin"]);
    const { id } = await params;

    const existing = await getTicketById(id);
    if (!existing) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    if (existing.ownerUid !== session.uid) {
      return NextResponse.json({ error: "You can only reopen your own tickets." }, { status: 403 });
    }
    if (existing.status !== "resolved") {
      return NextResponse.json(
        { error: "Only resolved tickets can be reopened." },
        { status: 400 }
      );
    }

    const ticket = await updateTicket(id, { status: "open" });

    await logEvent({
      event: "ticket.reopened",
      entityType: "ticket",
      entityId: id,
      summary: `Ticket "${existing.title}" reopened by student`,
      actorRole: session.role,
      actorUid: session.uid,
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    return apiErrorResponse(error, "Failed to reopen ticket.");
  }
}
