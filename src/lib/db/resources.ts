import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import type { Resource, ResourceInput } from "@/types/resource";

const COLLECTION = "resources";

function toIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date().toISOString();
}

function toResource(doc: DocumentSnapshot): Resource {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    title: data.title,
    description: data.description ?? "",
    subjectId: data.subjectId,
    subjectName: data.subjectName,
    topic: data.topic ?? null,
    topicName: data.topicName ?? null,
    category: data.category,
    teacher: data.teacher ?? null,
    uploader: data.uploader,
    tags: data.tags ?? [],
    resourceType: data.resourceType,
    sourceKind: data.sourceKind,
    fileUrl: data.fileUrl ?? null,
    filePath: data.filePath ?? null,
    fileSizeBytes: data.fileSizeBytes ?? null,
    externalUrl: data.externalUrl ?? null,
    thumbnailUrl: data.thumbnailUrl ?? null,
    featured: Boolean(data.featured),
    teacherRecommended: Boolean(data.teacherRecommended),
    pinned: Boolean(data.pinned),
    archived: Boolean(data.archived),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    createdBy: data.createdBy ?? "admin",
  };
}

export async function listResources(options?: { includeArchived?: boolean }): Promise<Resource[]> {
  const db = getAdminDb();
  let query = db.collection(COLLECTION).orderBy("createdAt", "desc") as FirebaseFirestore.Query;
  if (!options?.includeArchived) {
    query = db
      .collection(COLLECTION)
      .where("archived", "==", false)
      .orderBy("createdAt", "desc");
  }
  const snapshot = await query.get();
  return snapshot.docs.map(toResource);
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const doc = await getAdminDb().collection(COLLECTION).doc(id).get();
  return doc.exists ? toResource(doc) : null;
}

interface CreateResourceArgs extends ResourceInput {
  subjectName: string;
  topicName?: string | null;
}

export async function createResource(
  input: CreateResourceArgs,
  createdBy: string
): Promise<Resource> {
  const db = getAdminDb();
  const now = new Date();
  const ref = db.collection(COLLECTION).doc();
  await ref.set({
    title: input.title,
    description: input.description ?? "",
    subjectId: input.subjectId,
    subjectName: input.subjectName,
    topic: input.topic ?? null,
    topicName: input.topicName ?? null,
    category: input.category,
    teacher: input.teacher ?? null,
    uploader: input.uploader,
    tags: input.tags ?? [],
    resourceType: input.resourceType,
    sourceKind: input.sourceKind,
    fileUrl: input.fileUrl ?? null,
    filePath: input.filePath ?? null,
    fileSizeBytes: input.fileSizeBytes ?? null,
    externalUrl: input.externalUrl ?? null,
    thumbnailUrl: input.thumbnailUrl || null,
    featured: input.featured ?? false,
    teacherRecommended: input.teacherRecommended ?? false,
    pinned: input.pinned ?? false,
    archived: false,
    createdAt: now,
    updatedAt: now,
    createdBy,
  });
  const doc = await ref.get();
  return toResource(doc);
}

export async function updateResource(
  id: string,
  patch: Record<string, unknown>
): Promise<Resource | null> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  await ref.update({ ...patch, updatedAt: new Date() });
  const updated = await ref.get();
  return toResource(updated);
}

export async function deleteResource(id: string): Promise<boolean> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(id);
  const doc = await ref.get();
  if (!doc.exists) return false;

  const data = doc.data();
  if (data?.filePath) {
    try {
      await getAdminStorage().bucket().file(data.filePath).delete({ ignoreNotFound: true });
    } catch (error) {
      console.error(`Failed to delete storage file for resource ${id}:`, error);
    }
  }
  await ref.delete();
  return true;
}
