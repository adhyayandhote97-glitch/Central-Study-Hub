import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";

const COLLECTION = "ticketNotes";

/** Admin-only internal notes, deliberately kept off the `tickets` document
 * itself (see firestore.rules — that doc is directly readable by the
 * ticket's owner, and Firestore rules can't filter individual fields). */
export async function getInternalNotes(ticketId: string): Promise<string | null> {
  const doc = await getAdminDb().collection(COLLECTION).doc(ticketId).get();
  return doc.exists ? ((doc.data()?.notes as string | undefined) ?? null) : null;
}

export async function setInternalNotes(ticketId: string, notes: string | null): Promise<void> {
  const db = getAdminDb();
  if (!notes) {
    await db.collection(COLLECTION).doc(ticketId).delete();
    return;
  }
  await db.collection(COLLECTION).doc(ticketId).set({ notes, updatedAt: new Date() });
}
