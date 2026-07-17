import { Download } from "@/components/icons";
import type { Resource } from "@/types/resource";
import { ResourceIcon } from "../resource-icon";
import { RESOURCE_TYPE_LABELS } from "@/lib/constants";
import { formatBytes } from "@/lib/format-bytes";
import { Button } from "@/components/ui/button";

export function DownloadFallbackCard({
  resource,
  onDownload,
}: {
  resource: Resource;
  onDownload?: () => void;
}) {
  const href = resource.fileUrl ?? resource.externalUrl ?? "#";

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-md border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <ResourceIcon type={resource.resourceType} className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Preview isn&apos;t available</p>
        <p className="text-sm text-muted-foreground">
          {RESOURCE_TYPE_LABELS[resource.resourceType]}
          {resource.fileSizeBytes ? ` · ${formatBytes(resource.fileSizeBytes)}` : ""}
        </p>
      </div>
      <Button asChild onClick={onDownload}>
        <a href={href} target="_blank" rel="noopener noreferrer" download={resource.sourceKind === "file"}>
          <Download className="size-4" aria-hidden="true" />
          {resource.sourceKind === "file" ? "Download" : "Open link"}
        </a>
      </Button>
    </div>
  );
}
