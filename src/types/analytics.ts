import type { UserRole } from "./session";

export type AnalyticsEventType =
  | "resource.created"
  | "resource.updated"
  | "resource.deleted"
  | "resource.archived"
  | "resource.featured"
  | "resource.pinned"
  | "resource.viewed"
  | "resource.downloaded"
  | "ticket.created"
  | "ticket.statusChanged"
  | "ticket.replied"
  | "ticket.reopened"
  | "ticket.deleted"
  | "subject.created"
  | "subject.updated"
  | "subject.deleted"
  | "announcement.created"
  | "announcement.updated"
  | "announcement.deleted";

export interface AnalyticsEvent {
  id: string;
  event: AnalyticsEventType;
  entityType: "resource" | "ticket" | "subject" | "announcement";
  entityId: string;
  summary: string;
  actorRole: UserRole;
  actorUid: string;
  createdAt: string;
}

export interface UserRecord {
  uid: string;
  role: UserRole;
  createdAt: string;
  lastSeen: string;
}
