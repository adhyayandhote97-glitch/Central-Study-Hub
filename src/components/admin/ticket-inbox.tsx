"use client";

import * as React from "react";
import { Inbox, Search } from "@/components/icons";
import type { Ticket, TicketPriority, TicketStatus, TicketType } from "@/types/ticket";
import { TICKET_PRIORITIES, TICKET_STATUSES, TICKET_TYPES } from "@/lib/constants";
import { formatRelativeTime } from "@/lib/format-date";
import { TicketStatusBadge } from "@/components/student-voice/ticket-status-badge";
import { TicketDetailDrawer } from "./ticket-detail-drawer";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TicketInbox({
  tickets,
  loading,
  onChanged,
}: {
  tickets: Ticket[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<TicketStatus | "all">("all");
  const [type, setType] = React.useState<TicketType | "all">("all");
  const [priority, setPriority] = React.useState<TicketPriority | "all">("all");
  const [selected, setSelected] = React.useState<Ticket | null>(null);
  const [open, setOpen] = React.useState(false);

  // Keep the selected ticket's data fresh after mutations.
  React.useEffect(() => {
    if (selected) {
      const updated = tickets.find((t) => t.id === selected.id);
      if (updated) setSelected(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (type !== "all" && t.type !== type) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (q) {
        const haystack = [t.title, t.description, t.name, t.subjectName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, search, status, type, priority]);

  const openTicket = (ticket: Ticket) => {
    setSelected(ticket);
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-56">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets…"
            aria-label="Search tickets"
            className="h-9 pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus | "all")}>
          <SelectTrigger className="w-auto min-w-32" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TICKET_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => setType(v as TicketType | "all")}>
          <SelectTrigger className="w-auto min-w-36" aria-label="Filter by type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TICKET_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority | "all")}>
          <SelectTrigger className="w-auto min-w-28" aria-label="Filter by priority">
            <SelectValue placeholder="All priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {TICKET_PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-md" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No tickets"
          description="Nothing matches your filters. Student submissions will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-border">
          <ul className="divide-y divide-border">
            {filtered.map((ticket) => {
              const typeLabel = TICKET_TYPES.find((t) => t.value === ticket.type)?.label ?? ticket.type;
              return (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => openTicket(ticket)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:px-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-foreground">{ticket.title}</p>
                        {ticket.priority === "high" && (
                          <Badge variant="outline" className="text-[10px] text-destructive">
                            High
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {typeLabel}
                        {ticket.subjectName ? ` · ${ticket.subjectName}` : ""} ·{" "}
                        {ticket.isAnonymous ? "Anonymous" : ticket.name || "Unnamed"} ·{" "}
                        {formatRelativeTime(ticket.createdAt)}
                      </p>
                    </div>
                    <TicketStatusBadge status={ticket.status} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <TicketDetailDrawer ticket={selected} open={open} onOpenChange={setOpen} onChanged={onChanged} />
    </div>
  );
}
