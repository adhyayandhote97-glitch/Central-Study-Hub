import { Badge } from "@/components/ui/badge";
import { TICKET_STATUSES } from "@/lib/constants";
import type { TicketStatus } from "@/types/ticket";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-accent text-accent-foreground",
  "in-progress": "bg-primary/15 text-primary",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  closed: "bg-muted text-muted-foreground",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const label = TICKET_STATUSES.find((s) => s.value === status)?.label ?? status;
  return <Badge className={cn("border-transparent", STATUS_STYLES[status])}>{label}</Badge>;
}
