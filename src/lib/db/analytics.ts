import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import type { AnalyticsEvent, AnalyticsEventType } from "@/types/analytics";
import type { UserRole } from "@/types/session";

const COLLECTION = "analytics";

function toIso(value: unknown): string {
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return typeof value === "string" ? value : new Date().toISOString();
}

function toEvent(doc: DocumentSnapshot): AnalyticsEvent {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    event: data.event,
    entityType: data.entityType,
    entityId: data.entityId,
    summary: data.summary,
    actorRole: data.actorRole,
    actorUid: data.actorUid,
    createdAt: toIso(data.createdAt),
  };
}

/**
 * Records an activity-feed / analytics event. Never throws — a logging
 * failure should never block the mutation that triggered it.
 */
export async function logEvent(input: {
  event: AnalyticsEventType;
  entityType: AnalyticsEvent["entityType"];
  entityId: string;
  summary: string;
  actorRole: UserRole;
  actorUid: string;
}): Promise<void> {
  try {
    await getAdminDb()
      .collection(COLLECTION)
      .add({ ...input, createdAt: new Date() });
  } catch (error) {
    console.error("Failed to log analytics event:", error);
  }
}

export async function listRecentEvents(limit = 20): Promise<AnalyticsEvent[]> {
  const snapshot = await getAdminDb()
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map(toEvent);
}
