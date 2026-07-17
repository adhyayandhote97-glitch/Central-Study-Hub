import type { LucideIcon } from "@/components/icons";
import {
  BookOpen,
  Clock,
  GraduationCap,
  Megaphone,
  MessageCircleHeart,
} from "@/components/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const STUDENT_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: GraduationCap },
  { href: "/dashboard/subjects", label: "Subjects", icon: BookOpen },
  { href: "/dashboard/recent-uploads", label: "Recent Uploads", icon: Clock },
  { href: "/dashboard/announcements", label: "Announcements", icon: Megaphone },
  { href: "/dashboard/student-voice", label: "Student Voice", icon: MessageCircleHeart },
];
