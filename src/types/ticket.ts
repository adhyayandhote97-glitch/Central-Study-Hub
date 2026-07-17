export type TicketType =
  | "broken-resource"
  | "new-resource-request"
  | "suggestion"
  | "bug-report"
  | "general-feedback"
  | "other";

export type TicketPriority = "low" | "medium" | "high";

export type TicketStatus = "open" | "in-progress" | "resolved" | "closed";

export interface Ticket {
  id: string;
  ownerUid: string;
  type: TicketType;
  name: string | null;
  isAnonymous: boolean;
  subjectId: string | null;
  subjectName: string | null;
  title: string;
  description: string;
  priority: TicketPriority;
  attachmentUrl: string | null;
  attachmentPath: string | null;
  status: TicketStatus;
  adminReply: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface TicketInput {
  type: TicketType;
  name?: string | null;
  isAnonymous: boolean;
  subjectId?: string | null;
  title: string;
  description: string;
  priority: TicketPriority;
  attachmentUrl?: string | null;
  attachmentPath?: string | null;
}
