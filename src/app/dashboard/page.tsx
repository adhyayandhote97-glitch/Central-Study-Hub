"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Clock, Megaphone, ChevronRight } from "@/components/icons";
import { useResources } from "@/hooks/use-resources";
import { useAnnouncements } from "@/hooks/use-announcements";
import { HomeSearchBar } from "@/components/dashboard/home-search-bar";
import { QuickLinks } from "@/components/dashboard/quick-links";
import { FactOfTheDay } from "@/components/dashboard/fact-of-the-day";
import { HowToStudy } from "@/components/dashboard/how-to-study";
import { ResourceGrid } from "@/components/resources/resource-grid";
import { AnnouncementCard } from "@/components/dashboard/announcement-card";
import { EmptyState } from "@/components/shared/empty-state";

export default function DashboardHomePage() {
  const { resources, loading } = useResources();
  const { announcements } = useAnnouncements();

  const featured = React.useMemo(() => resources.filter((r) => r.featured).slice(0, 4), [resources]);
  const recent = React.useMemo(() => resources.slice(0, 8), [resources]);
  const homeAnnouncements = React.useMemo(() => announcements.slice(0, 3), [announcements]);

  return (
    <div className="flex flex-col gap-10">
      {/* Announcements first — the most time-sensitive information up top. */}
      {homeAnnouncements.length > 0 && (
        <section aria-labelledby="announcements-heading" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 id="announcements-heading" className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Megaphone className="size-4.5 text-muted-foreground" aria-hidden="true" />
              Announcements
            </h2>
            <Link
              href="/dashboard/announcements"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              View all
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {homeAnnouncements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
        </section>
      )}

      <FactOfTheDay />

      <HowToStudy />

      <section className="flex flex-col gap-5 pt-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you need for MYP5.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Subjects, resources, past papers and more, all in one place.
          </p>
        </div>
        <div className="w-full max-w-2xl">
          <HomeSearchBar />
        </div>
      </section>

      <section aria-labelledby="quick-links-heading" className="flex flex-col gap-4">
        <h2 id="quick-links-heading" className="sr-only">
          Quick links
        </h2>
        <QuickLinks />
      </section>

      <section aria-labelledby="featured-heading" className="flex flex-col gap-4">
        <h2 id="featured-heading" className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="size-4.5 text-muted-foreground" aria-hidden="true" />
          Featured Resources
        </h2>
        {!loading && featured.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No featured resources yet"
            description="When your teachers feature a resource, it'll show up here first."
          />
        ) : (
          <ResourceGrid resources={featured} loading={loading} />
        )}
      </section>

      <section aria-labelledby="recent-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="recent-heading" className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Clock className="size-4.5 text-muted-foreground" aria-hidden="true" />
            Recent Uploads
          </h2>
          <Link
            href="/dashboard/recent-uploads"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            View all
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        {!loading && recent.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Nothing uploaded yet"
            description="Newly added resources from all your subjects will appear here."
          />
        ) : (
          <ResourceGrid resources={recent} loading={loading} />
        )}
      </section>
    </div>
  );
}
