import { format, formatDistanceToNow } from "date-fns";

export function formatRelativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function formatDate(iso: string): string {
  return format(new Date(iso), "d MMM yyyy");
}
