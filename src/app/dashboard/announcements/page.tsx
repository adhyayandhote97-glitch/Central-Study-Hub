"use client";

import { Megaphone } from "@/components/icons";
import { useAnnouncements } from "@/hooks/use-announcements";
import { AnnouncementCard } from "@/components/dashboard/announcement-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnnouncementsPage() {
  const { announcements, loading } = useAnnouncements();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Announcements</h1>
        <p className="mt-1 text-sm text-muted-foreground">Updates from your teachers and admins.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements right now"
          description="Check back later for updates."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      )}
    </div>
  );
}
