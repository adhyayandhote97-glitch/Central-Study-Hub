"use client";

import * as React from "react";
import { ChevronDown, Inbox } from "@/components/icons";
import { useMyTickets } from "@/hooks/use-my-tickets";
import { formatRelativeTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { TicketStatusBadge } from "./ticket-status-badge";
import { TicketThread } from "./ticket-thread";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function MyTicketsList() {
  const { tickets, loading } = useMyTickets();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-md" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No tickets yet"
        description="Anything you submit through Student Voice will show up here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tickets.map((ticket) => {
        const expanded = expandedId === ticket.id;
        return (
          <div key={ticket.id} className="overflow-hidden rounded-md border border-border bg-card">
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : ticket.id)}
              aria-expanded={expanded}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{ticket.title}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(ticket.createdAt)}</p>
              </div>
              <TicketStatusBadge status={ticket.status} />
              <ChevronDown
                className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
                aria-hidden="true"
              />
            </button>
            {expanded && <TicketThread ticket={ticket} />}
          </div>
        );
      })}
    </div>
  );
}
