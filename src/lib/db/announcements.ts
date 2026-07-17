import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Announcement, AnnouncementInput } from "@/types/announcement";

const COLLECTION = "announcements";

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : null;
}

function toAnnouncement(doc: DocumentSnapshot): Announcement {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    title: data.title,
    body: data.body,
    pinned: Boolean(data.pinned),
    expiresAt: toIso(data.expiresAt),
    createdAt: toIso(data.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(data.updatedAt) ?? new Date().toISOString(),
    createdBy: data.createdBy ?? "admin",
  };
}

/** Returns announcements that haven't expired, pinned first, then newest. */
export async function listActiveAnnouncements(): Promise<Announcement[]> {
  const snapshot = await getAdminDb().collection(COLLECTION).orderBy("createdAt", "desc").get();
  const now = Date.now();
  return snapshot.docs
    .map(toAnnouncement)
    .filter((a) => !a.expiresAt || new Date(a.expiresAt).getTime() > now)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

/** Returns every announcement including expired ones — for the admin manager. */
export async function listAllAnnouncements(): Promise<Announcement[]> {
  const snapshot = await getAdminDb().collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snapshot.docs.map(toAnnouncement).sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function createAnnouncement(input: AnnouncementInput, createdBy: string): Promise<Announcement> {
  const db = getAdminDb();
  const now = new Date();
  const ref = db.collection(COLLECTION).doc();
  await ref.set({
    title: input.title,
    body: input.body,
    pinned: input.pinned ?? false,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    createdAt: now,
    updatedAt: now,
    createdBy,
  });
  const doc = await ref.get();
  return toAnnouncement(doc);
}

export async function updateAnnouncement(
  id: string,
  patch: Partial<AnnouncementInput>
): Promise<Announcement | null> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.body !== undefined) updatePayload.body = patch.body;
  if (patch.pinned !== undefined) updatePayload.pinned = patch.pinned;
  if (patch.expiresAt !== undefined) {
    updatePayload.expiresAt = patch.expiresAt ? new Date(patch.expiresAt) : null;
  }

  await ref.update(updatePayload);
  const updated = await ref.get();
  return toAnnouncement(updated);
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;
  await ref.delete();
  return true;
}
