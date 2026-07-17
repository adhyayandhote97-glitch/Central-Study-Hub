"use client";

import { Activity, Download, FolderOpen, HardDrive, Inbox, Layers, UploadCloud } from "@/components/icons";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { formatBytes } from "@/lib/format-bytes";
import { StatCard } from "@/components/admin/stat-card";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const { stats, loading } = useAdminStats();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">An overview of Central Study Hub activity.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total Resources" value={stats?.totalResources ?? 0} icon={FolderOpen} />
          <StatCard label="Subjects" value={stats?.subjects ?? 0} icon={Layers} />
          <StatCard
            label="Recent Uploads"
            value={stats?.recentUploads ?? 0}
            hint="Last 7 days"
            icon={UploadCloud}
          />
          <StatCard
            label="Open Tickets"
            value={stats?.openTickets ?? 0}
            hint={`${stats?.resolvedTickets ?? 0} resolved`}
            icon={Inbox}
          />
          <StatCard
            label="Storage Used"
            value={formatBytes(stats?.storageBytes ?? 0)}
            icon={HardDrive}
          />
          <StatCard label="Downloads" value={stats?.totalDownloads ?? 0} icon={Download} />
        </div>
      )}

      <section aria-labelledby="activity-heading" className="flex flex-col gap-4">
        <h2 id="activity-heading" className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Activity className="size-4.5 text-muted-foreground" aria-hidden="true" />
          Recent Activity
        </h2>
        <ActivityFeed />
      </section>
    </div>
  );
}
