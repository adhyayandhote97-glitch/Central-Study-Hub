import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { DailyFact, DailyFactInput } from "@/types/homepage";

const COLLECTION = "dailyFacts";

function toIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date().toISOString();
}

function toFact(doc: DocumentSnapshot): DailyFact {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    type: data.type,
    text: data.text,
    author: data.author ?? null,
    active: data.active !== false,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function listAllFacts(): Promise<DailyFact[]> {
  const snap = await getAdminDb().collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snap.docs.map(toFact);
}

/**
 * Returns the "fact of the day": a stable pick from the active pool that
 * rotates once per calendar day, so every student sees the same fact today
 * and a different one tomorrow.
 */
export async function getFactOfTheDay(): Promise<DailyFact | null> {
  const snap = await getAdminDb().collection(COLLECTION).where("active", "==", true).get();
  const facts = snap.docs.map(toFact).sort((a, b) => a.id.localeCompare(b.id));
  if (facts.length === 0) return null;
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return facts[dayIndex % facts.length];
}

export async function createFact(input: DailyFactInput): Promise<DailyFact> {
  const db = getAdminDb();
  const now = new Date();
  const ref = db.collection(COLLECTION).doc();
  await ref.set({
    type: input.type,
    text: input.text,
    author: input.author ?? null,
    active: input.active ?? true,
    createdAt: now,
    updatedAt: now,
  });
  return toFact(await ref.get());
}

export async function updateFact(id: string, patch: Partial<DailyFactInput>): Promise<DailyFact | null> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  if (!(await ref.get()).exists) return null;
  await ref.update({ ...patch, updatedAt: new Date() });
  return toFact(await ref.get());
}

export async function deleteFact(id: string): Promise<boolean> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  if (!(await ref.get()).exists) return false;
  await ref.delete();
  return true;
}
