"use client";

import * as React from "react";
import { Loader2, Paperclip, Trash2 } from "@/components/icons";
import { toast } from "sonner";
import type { Ticket, TicketStatus } from "@/types/ticket";
import { TICKET_PRIORITIES, TICKET_STATUSES, TICKET_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/format-date";
import { TicketStatusBadge } from "@/components/student-voice/ticket-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function TicketDetailDrawer({
  ticket,
  open,
  onOpenChange,
  onChanged,
}: {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [status, setStatus] = React.useState<TicketStatus>("open");
  const [reply, setReply] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [savingReply, setSavingReply] = React.useState(false);
  const [savingNotes, setSavingNotes] = React.useState(false);
  const [savingStatus, setSavingStatus] = React.useState(false);

  React.useEffect(() => {
    if (!ticket) return;
    setStatus(ticket.status);
    setReply(ticket.adminReply ?? "");
    setNotes("");
    // Internal notes live in a separate collection; fetch the full ticket.
    fetch(`/api/tickets/${ticket.id}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setNotes(data.ticket?.internalNotes ?? "");
        }
      })
      .catch(() => {});
  }, [ticket]);

  if (!ticket) return null;

  const typeLabel = TICKET_TYPES.find((t) => t.value === ticket.type)?.label ?? ticket.type;
  const priorityLabel =
    TICKET_PRIORITIES.find((p) => p.value === ticket.priority)?.label ?? ticket.priority;

  const patch = async (body: Record<string, unknown>, setBusy: (b: boolean) => void, message: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Update failed.");
      }
      toast.success(message);
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Ticket deleted.");
      onOpenChange(false);
      onChanged();
    } catch {
      toast.error("Couldn't delete ticket.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="pr-8">{ticket.title}</SheetTitle>
          <SheetDescription>
            {ticket.isAnonymous ? "Anonymous" : ticket.name || "Unnamed student"} · Submitted{" "}
            {formatDate(ticket.createdAt)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <TicketStatusBadge status={ticket.status} />
            <Badge variant="outline">{typeLabel}</Badge>
            <Badge variant="outline">{priorityLabel} priority</Badge>
            {ticket.subjectName && <Badge variant="outline">{ticket.subjectName}</Badge>}
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <p className="rounded-lg bg-muted/40 p-3 text-sm whitespace-pre-wrap text-foreground">
              {ticket.description}
            </p>
          </div>

          {ticket.attachmentUrl && (
            <a
              href={ticket.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm hover:bg-muted"
            >
              <Paperclip className="size-3.5" aria-hidden="true" />
              View attachment
            </a>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ticket-status">Status</Label>
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)}>
                <SelectTrigger id="ticket-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => patch({ status }, setSavingStatus, "Status updated.")}
                disabled={savingStatus || status === ticket.status}
              >
                {savingStatus && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Update
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-reply">Reply to student</Label>
            <Textarea
              id="ticket-reply"
              rows={4}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply the student will see…"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => patch({ adminReply: reply.trim() || null }, setSavingReply, "Reply saved.")}
              disabled={savingReply}
              className="w-fit"
            >
              {savingReply && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save reply
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-notes">Internal notes (admin only)</Label>
            <Textarea
              id="ticket-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private notes, never shown to students…"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => patch({ internalNotes: notes.trim() || null }, setSavingNotes, "Notes saved.")}
              disabled={savingNotes}
              className="w-fit"
            >
              {savingNotes && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save notes
            </Button>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" size="sm" className="w-fit">
                <Trash2 className="size-4" aria-hidden="true" />
                Delete ticket
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this ticket?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes &ldquo;{ticket.title}&rdquo; and its internal notes. This
                  can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
