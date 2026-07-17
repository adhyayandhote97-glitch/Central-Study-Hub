import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { SEED_SUBJECTS } from "@/lib/constants";
import { slugify } from "@/lib/slugify";
import type { Subject, SubjectInput, Topic } from "@/types/subject";

const COLLECTION = "subjects";

function toIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date().toISOString();
}

function toSubject(doc: DocumentSnapshot): Subject {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    name: data.name,
    slug: data.slug,
    order: data.order ?? 0,
    icon: data.icon,
    color: data.color,
    topics: (data.topics ?? []) as Topic[],
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

let seedChecked = false;

/** Idempotently seeds the 10 fixed MYP5 subjects on first access. */
export async function ensureSeeded(): Promise<void> {
  if (seedChecked) return;
  const db = getAdminDb();
  const snapshot = await db.collection(COLLECTION).limit(1).get();
  if (snapshot.empty) {
    const batch = db.batch();
    const now = new Date();
    for (const subject of SEED_SUBJECTS) {
      const ref = db.collection(COLLECTION).doc(subject.slug);
      batch.set(ref, {
        name: subject.name,
        slug: subject.slug,
        order: subject.order,
        icon: subject.icon,
        color: subject.color,
        topics: [],
        createdAt: now,
        updatedAt: now,
      });
    }
    await batch.commit();
  }
  seedChecked = true;
}

export async function listSubjects(): Promise<Subject[]> {
  await ensureSeeded();
  const db = getAdminDb();
  const snapshot = await db.collection(COLLECTION).orderBy("order", "asc").get();
  return snapshot.docs.map(toSubject);
}

export async function getSubjectById(id: string): Promise<Subject | null> {
  const db = getAdminDb();
  const doc = await db.collection(COLLECTION).doc(id).get();
  return doc.exists ? toSubject(doc) : null;
}

export async function createSubject(input: SubjectInput): Promise<Subject> {
  const db = getAdminDb();
  const slug = slugify(input.name);
  const now = new Date();
  const countSnapshot = await db.collection(COLLECTION).count().get();
  const ref = db.collection(COLLECTION).doc(slug);
  await ref.set({
    name: input.name,
    slug,
    order: input.order ?? countSnapshot.data().count,
    icon: input.icon,
    color: input.color,
    topics: [],
    createdAt: now,
    updatedAt: now,
  });
  const doc = await ref.get();
  return toSubject(doc);
}

export async function updateSubject(
  id: string,
  patch: Partial<SubjectInput>
): Promise<Subject | null> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  await ref.update({ ...patch, updatedAt: new Date() });
  const updated = await ref.get();
  return toSubject(updated);
}

export async function deleteSubject(id: string): Promise<void> {
  await getAdminDb().collection(COLLECTION).doc(id).delete();
}

export async function addTopic(subjectId: string, name: string): Promise<Subject | null> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(subjectId);
  const doc = await ref.get();
  if (!doc.exists) return null;

  const data = doc.data() ?? {};
  const topics: Topic[] = data.topics ?? [];
  const slug = slugify(name);
  if (topics.some((t) => t.slug === slug)) {
    return toSubject(doc);
  }
  const newTopic: Topic = { slug, name, order: topics.length };
  await ref.update({ topics: [...topics, newTopic], updatedAt: new Date() });
  const updated = await ref.get();
  return toSubject(updated);
}

export async function removeTopic(subjectId: string, topicSlug: string): Promise<Subject | null> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(subjectId);
  const doc = await ref.get();
  if (!doc.exists) return null;

  const data = doc.data() ?? {};
  const topics: Topic[] = (data.topics ?? []).filter((t: Topic) => t.slug !== topicSlug);
  await ref.update({ topics, updatedAt: new Date() });
  const updated = await ref.get();
  return toSubject(updated);
}

