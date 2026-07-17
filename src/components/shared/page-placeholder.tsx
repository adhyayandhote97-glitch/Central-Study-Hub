import type { LucideIcon } from "@/components/icons";
import { EmptyState } from "./empty-state";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Temporary stand-in for a page that's implemented in a later build phase. */
export function PagePlaceholder({ title, description, icon }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      </div>
      <EmptyState icon={icon} title="Coming soon" description={description} className="py-20" />
    </div>
  );
}
