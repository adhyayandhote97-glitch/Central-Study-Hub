import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse, requireRole } from "@/lib/auth/requireRole";
import { deleteTicket, getTicketById, updateTicket } from "@/lib/db/tickets";
import { getInternalNotes, setInternalNotes } from "@/lib/db/ticket-notes";
import { logEvent } from "@/lib/db/analytics";
import { ticketPatchSchema } from "@/lib/validation/ticketSchema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(request, ["admin"]);
    const { id } = await params;
    const ticket = await getTicketById(id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    const internalNotes = await getInternalNotes(id);
    return NextResponse.json({ ticket: { ...ticket, internalNotes } });
  } catch (error) {
    return apiErrorResponse(error, "Failed to load ticket.");
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ["admin"]);
    const { id } = await params;
    const json = await request.json().catch(() => null);
    const parsed = ticketPatchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    // Internal notes live in a separate, admin-only-readable collection —
    // never on the ticket document itself (see lib/db/ticket-notes.ts).
    const { internalNotes, ...ticketPatch } = parsed.data;

    const ticket =
      Object.keys(ticketPatch).length > 0 ? await updateTicket(id, ticketPatch) : await getTicketById(id);
    if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });

    if (internalNotes !== undefined) {
      await setInternalNotes(id, internalNotes);
    }

    const summary = parsed.data.status
      ? `Ticket "${ticket.title}" marked ${parsed.data.status.replace(/-/g, " ")}`
      : parsed.data.adminReply !== undefined
        ? `Replied to ticket "${ticket.title}"`
        : `Updated ticket "${ticket.title}"`;

    await logEvent({
      event: parsed.data.status ? "ticket.statusChanged" : "ticket.replied",
      entityType: "ticket",
      entityId: ticket.id,
      summary,
      actorRole: session.role,
      actorUid: session.uid,
    });

    const finalNotes = await getInternalNotes(id);
    return NextResponse.json({ ticket: { ...ticket, internalNotes: finalNotes } });
  } catch (error) {
    return apiErrorResponse(error, "Failed to update ticket.");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireRole(request, ["admin"]);
    const { id } = await params;
    const ticket = await getTicketById(id);
    const deleted = await deleteTicket(id);
    if (!deleted) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    await setInternalNotes(id, null);

    await logEvent({
      event: "ticket.deleted",
      entityType: "ticket",
      entityId: id,
      summary: `Deleted ticket "${ticket?.title ?? id}"`,
      actorRole: session.role,
      actorUid: session.uid,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, "Failed to delete ticket.");
  }
}
