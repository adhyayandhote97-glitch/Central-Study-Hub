import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { StudyTip, StudyTipInput } from "@/types/homepage";

const COLLECTION = "studyTips";

function toIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date().toISOString();
}

function toTip(doc: DocumentSnapshot): StudyTip {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    title: data.title,
    body: data.body,
    category: data.category,
    order: data.order ?? 0,
    active: data.active !== false,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function listStudyTips(options?: { activeOnly?: boolean }): Promise<StudyTip[]> {
  const snap = await getAdminDb().collection(COLLECTION).get();
  let tips = snap.docs.map(toTip);
  if (options?.activeOnly) tips = tips.filter((t) => t.active);
  return tips.sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export async function createStudyTip(input: StudyTipInput): Promise<StudyTip> {
  const db = getAdminDb();
  const now = new Date();
  const count = (await db.collection(COLLECTION).count().get()).data().count;
  const ref = db.collection(COLLECTION).doc();
  await ref.set({
    title: input.title,
    body: input.body,
    category: input.category,
    order: input.order ?? count,
    active: input.active ?? true,
    createdAt: now,
    updatedAt: now,
  });
  return toTip(await ref.get());
}

export async function updateStudyTip(id: string, patch: Partial<StudyTipInput>): Promise<StudyTip | null> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  if (!(await ref.get()).exists) return null;
  await ref.update({ ...patch, updatedAt: new Date() });
  return toTip(await ref.get());
}

export async function deleteStudyTip(id: string): Promise<boolean> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  if (!(await ref.get()).exists) return false;
  await ref.delete();
  return true;
}
