import type { LucideIcon } from "@/components/icons";
import {
  BarChart3,
  BookOpen,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  Settings,
  UploadCloud,
} from "@/components/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/upload", label: "Upload Resource", icon: UploadCloud },
  { href: "/admin/resources", label: "Manage Resources", icon: FolderOpen },
  { href: "/admin/subjects", label: "Manage Subjects", icon: BookOpen },
  { href: "/admin/homepage", label: "Homepage", icon: Lightbulb },
  { href: "/admin/tickets", label: "Manage Tickets", icon: Inbox },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
