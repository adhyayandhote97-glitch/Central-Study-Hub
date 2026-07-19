"use client";

import { useRouter } from "next/navigation";
import { useSubjects } from "@/hooks/use-subjects";
import { ResourceForm } from "@/components/admin/resource-form";
import { isStorageAvailableClient } from "@/lib/storage-availability";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUploadPage() {
  const { subjects, loading } = useSubjects();
  const router = useRouter();
  const storageAvailable = isStorageAvailableClient();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Upload Resource</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {storageAvailable
            ? "Upload a file or add a link, with full metadata."
            : "Add a link (Google Drive, Docs/Slides/Sheets, or YouTube), with full metadata."}
        </p>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-28 rounded-md" />
              <Skeleton className="h-9" />
              <Skeleton className="h-20" />
            </div>
          ) : (
            <ResourceForm
              subjects={subjects}
              onSaved={() => router.push("/admin/resources")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
