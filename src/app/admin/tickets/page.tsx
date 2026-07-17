"use client";

import { useAdminTickets } from "@/hooks/use-admin-tickets";
import { TicketInbox } from "@/components/admin/ticket-inbox";

export default function AdminTicketsPage() {
  const { tickets, loading, refetch } = useAdminTickets();

  const openCount = tickets.filter((t) => t.status === "open" || t.status === "in-progress").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Manage Tickets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The Student Voice inbox, {openCount} open. Reply, change status, add notes, or delete.
        </p>
      </div>

      <TicketInbox tickets={tickets} loading={loading} onChanged={refetch} />
    </div>
  );
}
