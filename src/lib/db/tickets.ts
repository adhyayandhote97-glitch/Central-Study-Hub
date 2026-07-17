import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Ticket, TicketInput } from "@/types/ticket";

const COLLECTION = "tickets";

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : null;
}

function toTicket(doc: DocumentSnapshot): Ticket {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    ownerUid: data.ownerUid,
    type: data.type,
    name: data.name ?? null,
    isAnonymous: Boolean(data.isAnonymous),
    subjectId: data.subjectId ?? null,
    subjectName: data.subjectName ?? null,
    title: data.title,
    description: data.description,
    priority: data.priority,
    attachmentUrl: data.attachmentUrl ?? null,
    attachmentPath: data.attachmentPath ?? null,
    status: data.status,
    adminReply: data.adminReply ?? null,
    // Never stored on this doc — see lib/db/ticket-notes.ts. Callers that
    // need it merge it in separately (admin-only).
    internalNotes: null,
    createdAt: toIso(data.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(data.updatedAt) ?? new Date().toISOString(),
    resolvedAt: toIso(data.resolvedAt),
  };
}

interface CreateTicketArgs extends TicketInput {
  subjectName?: string | null;
}

export async function createTicket(input: CreateTicketArgs, ownerUid: string): Promise<Ticket> {
  const db = getAdminDb();
  const now = new Date();
  const ref = db.collection(COLLECTION).doc();
  await ref.set({
    ownerUid,
    type: input.type,
    name: input.isAnonymous ? null : (input.name ?? null),
    isAnonymous: input.isAnonymous,
    subjectId: input.subjectId ?? null,
    subjectName: input.subjectName ?? null,
    title: input.title,
    description: input.description,
    priority: input.priority,
    attachmentUrl: input.attachmentUrl ?? null,
    attachmentPath: input.attachmentPath ?? null,
    status: "open",
    adminReply: null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
  });
  const doc = await ref.get();
  return toTicket(doc);
}

export async function listTickets(): Promise<Ticket[]> {
  const snapshot = await getAdminDb().collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snapshot.docs.map(toTicket);
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const doc = await getAdminDb().collection(COLLECTION).doc(id).get();
  return doc.exists ? toTicket(doc) : null;
}

export async function updateTicket(
  id: string,
  patch: Record<string, unknown>
): Promise<Ticket | null> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const now = new Date();
  const updatePayload: Record<string, unknown> = { ...patch, updatedAt: now };
  if (patch.status === "resolved" || patch.status === "closed") {
    updatePayload.resolvedAt = now;
  } else if (patch.status === "open" || patch.status === "in-progress") {
    updatePayload.resolvedAt = null;
  }

  await ref.update(updatePayload);
  const updated = await ref.get();
  return toTicket(updated);
}

export async function deleteTicket(id: string): Promise<boolean> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
}
