import Link from "next/link";
import { BookOpen, Clock, Megaphone, MessageCircleHeart, type LucideIcon } from "@/components/icons";

const QUICK_LINKS: { href: string; label: string; description: string; icon: LucideIcon }[] = [
  {
    href: "/dashboard/subjects",
    label: "Subjects",
    description: "Browse every MYP5 subject",
    icon: BookOpen,
  },
  {
    href: "/dashboard/recent-uploads",
    label: "Recent Uploads",
    description: "See what's new this week",
    icon: Clock,
  },
  {
    href: "/dashboard/announcements",
    label: "Announcements",
    description: "Updates from your teachers",
    icon: Megaphone,
  },
  {
    href: "/dashboard/student-voice",
    label: "Student Voice",
    description: "Ask, suggest, or report",
    icon: MessageCircleHeart,
  },
];

export function QuickLinks() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {QUICK_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="group flex flex-col gap-3 rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-transform group-hover:scale-105">
            <link.icon className="size-4.5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-medium text-foreground">{link.label}</span>
            <span className="block text-xs text-muted-foreground">{link.description}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
