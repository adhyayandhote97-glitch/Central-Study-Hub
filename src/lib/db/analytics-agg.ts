import "server-only";
import { listResources } from "./resources";
import { listTickets } from "./tickets";
import { RESOURCE_TYPE_LABELS } from "@/lib/constants";

export interface AnalyticsData {
  resourcesByMonth: { month: string; count: number }[];
  resourcesBySubject: { subject: string; count: number }[];
  resourcesByType: { type: string; count: number }[];
  ticketsByStatus: { status: string; count: number }[];
  ticketsByType: { type: string; count: number }[];
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function titleize(value: string): string {
  return value
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const [resources, tickets] = await Promise.all([
    listResources({ includeArchived: true }),
    listTickets(),
  ]);

  // Resources created per month over the last 6 months.
  const now = new Date();
  const months: { key: string; month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      count: 0,
    });
  }
  const monthIndex = new Map(months.map((m, i) => [m.key, i]));
  for (const r of resources) {
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const idx = monthIndex.get(key);
    if (idx !== undefined) months[idx].count += 1;
  }

  const bySubject = new Map<string, number>();
  const byType = new Map<string, number>();
  for (const r of resources) {
    bySubject.set(r.subjectName, (bySubject.get(r.subjectName) ?? 0) + 1);
    const typeLabel = RESOURCE_TYPE_LABELS[r.resourceType];
    byType.set(typeLabel, (byType.get(typeLabel) ?? 0) + 1);
  }

  const ticketStatus = new Map<string, number>();
  const ticketType = new Map<string, number>();
  for (const t of tickets) {
    ticketStatus.set(t.status, (ticketStatus.get(t.status) ?? 0) + 1);
    ticketType.set(t.type, (ticketType.get(t.type) ?? 0) + 1);
  }

  return {
    resourcesByMonth: months.map(({ month, count }) => ({ month, count })),
    resourcesBySubject: [...bySubject.entries()]
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count),
    resourcesByType: [...byType.entries()].map(([type, count]) => ({ type, count })),
    ticketsByStatus: [...ticketStatus.entries()].map(([status, count]) => ({
      status: titleize(status),
      count,
    })),
    ticketsByType: [...ticketType.entries()].map(([type, count]) => ({ type: titleize(type), count })),
  };
}
