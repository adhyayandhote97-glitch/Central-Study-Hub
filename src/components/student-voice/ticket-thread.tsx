"use client";

import * as React from "react";
import { Loader2, Paperclip, RotateCcw, ShieldCheck } from "@/components/icons";
import { toast } from "sonner";
import type { Ticket } from "@/types/ticket";
import { TICKET_PRIORITIES, TICKET_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function TicketThread({ ticket, onReopened }: { ticket: Ticket; onReopened?: () => void }) {
  const [reopening, setReopening] = React.useState(false);
  const typeLabel = TICKET_TYPES.find((t) => t.value === ticket.type)?.label ?? ticket.type;
  const priorityLabel = TICKET_PRIORITIES.find((p) => p.value === ticket.priority)?.label ?? ticket.priority;

  const handleReopen = async () => {
    setReopening(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/reopen`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't reopen this ticket.");
      toast.success("Ticket reopened.");
      onReopened?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't reopen this ticket.");
    } finally {
      setReopening(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Badge variant="outline">{typeLabel}</Badge>
        <Badge variant="outline">{priorityLabel} priority</Badge>
        {ticket.subjectName && <Badge variant="outline">{ticket.subjectName}</Badge>}
        <span>Submitted {formatDate(ticket.createdAt)}</span>
      </div>

      <p className="text-sm whitespace-pre-wrap text-foreground">{ticket.description}</p>

      {ticket.attachmentUrl && (
        <a
          href={ticket.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground hover:bg-muted"
        >
          <Paperclip className="size-3.5" aria-hidden="true" />
          View attachment
        </a>
      )}

      {ticket.adminReply && (
        <div className="flex flex-col gap-1.5 rounded-md bg-accent/40 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Reply from the admin team
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{ticket.adminReply}</p>
        </div>
      )}

      {ticket.status === "resolved" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReopen}
          disabled={reopening}
          className="w-fit"
        >
          {reopening ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="size-4" aria-hidden="true" />
          )}
          Reopen ticket
        </Button>
      )}
    </div>
  );
}
