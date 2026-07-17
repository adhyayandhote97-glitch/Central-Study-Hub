import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import { listResources } from "./resources";
import { listTickets } from "./tickets";

export interface AdminStats {
  totalResources: number;
  archivedResources: number;
  subjects: number;
  recentUploads: number; // last 7 days
  openTickets: number;
  resolvedTickets: number;
  totalTickets: number;
  storageBytes: number;
  totalDownloads: number;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function getAdminStats(): Promise<AdminStats> {
  const db = getAdminDb();
  const [resources, tickets, subjectsSnap, downloadsSnap] = await Promise.all([
    listResources({ includeArchived: true }),
    listTickets(),
    db.collection("subjects").count().get(),
    db.collection("downloads").count().get(),
  ]);

  const now = Date.now();
  const activeResources = resources.filter((r) => !r.archived);

  return {
    totalResources: activeResources.length,
    archivedResources: resources.length - activeResources.length,
    subjects: subjectsSnap.data().count,
    recentUploads: resources.filter((r) => now - new Date(r.createdAt).getTime() < SEVEN_DAYS_MS)
      .length,
    openTickets: tickets.filter((t) => t.status === "open" || t.status === "in-progress").length,
    resolvedTickets: tickets.filter((t) => t.status === "resolved" || t.status === "closed").length,
    totalTickets: tickets.length,
    storageBytes: resources.reduce((sum, r) => sum + (r.fileSizeBytes ?? 0), 0),
    totalDownloads: downloadsSnap.data().count,
  };
}
