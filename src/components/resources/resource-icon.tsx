import { getResourceIcon } from "@/lib/resource-type";
import type { ResourceType } from "@/types/resource";
import { cn } from "@/lib/utils";

export function ResourceIcon({ type, className }: { type: ResourceType; className?: string }) {
  const Icon = getResourceIcon(type);
  return <Icon className={cn("size-4", className)} aria-hidden="true" />;
}
