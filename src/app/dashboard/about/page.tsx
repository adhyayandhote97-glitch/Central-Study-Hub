import Link from "next/link";
import {
  BookOpen,
  MessageCircleHeart,
  Search,
  Sparkles,
  type LucideIcon,
} from "@/components/icons";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: BookOpen,
    title: "Every subject, one place",
    description:
      "Every MYP5 subject, organised by topic and category: teacher resources, notes, past papers, revision sheets, worksheets and more.",
  },
  {
    icon: Search,
    title: "Find anything, instantly",
    description:
      "Search across titles, descriptions, teachers, topics and tags. Results appear as you type.",
  },
  {
    icon: Sparkles,
    title: "Made for daily use",
    description:
      "Favourite what matters, pick up where you left off with Recently Viewed, and preview PDFs, videos and slides without leaving the page.",
  },
  {
    icon: MessageCircleHeart,
    title: "Your voice counts",
    description:
      "Request resources, flag broken links, or share feedback through Student Voice, and track every ticket to resolution.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">About Central Study Hub</h1>
        <p className="text-muted-foreground">
          Central Study Hub brings every learning resource for MYP5 into one calm, fast, beautiful
          place, replacing scattered Drive folders, chat messages and lost links. Built for the
          students and teachers of Victorious Kidss Educares.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <Card key={feature.title}>
            <CardContent className="flex flex-col gap-2">
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <feature.icon className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium text-foreground">{feature.title}</p>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="font-medium text-foreground">A quick start</p>
          <p className="text-muted-foreground">
            Browse by <Link href="/dashboard/subjects" className="text-primary hover:underline">Subject</Link>, jump to the{" "}
            <Link href="/dashboard/recent-uploads" className="text-primary hover:underline">newest uploads</Link>, or head
            straight to <Link href="/dashboard/search" className="text-primary hover:underline">Search</Link> when you know
            what you need. Have a suggestion? The{" "}
            <Link href="/dashboard/student-voice" className="text-primary hover:underline">Student Voice</Link> is always open.
          </p>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Central Study Hub · Victorious Kidss Educares · MYP5
      </p>
    </div>
  );
}
