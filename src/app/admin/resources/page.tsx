"use client";

import Link from "next/link";
import { UploadCloud } from "@/components/icons";
import { useResources } from "@/hooks/use-resources";
import { useSubjects } from "@/hooks/use-subjects";
import { ResourceTable } from "@/components/admin/resource-table";
import { Button } from "@/components/ui/button";

export default function AdminResourcesPage() {
  const { resources, loading, refetch } = useResources({ includeArchived: true });
  const { subjects } = useSubjects();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Manage Resources</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search, edit, feature, pin, archive and delete resources.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/upload">
            <UploadCloud className="size-4" aria-hidden="true" />
            Upload
          </Link>
        </Button>
      </div>

      <ResourceTable resources={resources} subjects={subjects} loading={loading} onChanged={refetch} />
    </div>
  );
}
