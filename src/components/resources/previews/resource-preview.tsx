import type { Resource } from "@/types/resource";
import { isPreviewable } from "@/lib/resource-type";
import { getGoogleEmbedUrl, getYouTubeEmbedUrl } from "@/lib/embed-urls";
import { PdfPreview } from "./pdf-preview";
import { ImagePreview } from "./image-preview";
import { VideoPreview } from "./video-preview";
import { GoogleEmbedPreview } from "./google-embed-preview";
import { YouTubePreview } from "./youtube-preview";
import { DownloadFallbackCard } from "./download-fallback-card";

export function ResourcePreview({ resource }: { resource: Resource }) {
  const url = resource.fileUrl ?? resource.externalUrl;

  if (!url || !isPreviewable(resource.resourceType)) {
    return <DownloadFallbackCard resource={resource} />;
  }

  switch (resource.resourceType) {
    case "pdf":
      return <PdfPreview url={url} title={resource.title} />;
    case "image":
      return <ImagePreview url={url} title={resource.title} />;
    case "video":
      return <VideoPreview url={url} title={resource.title} />;
    case "youtube": {
      const embedUrl = getYouTubeEmbedUrl(url);
      if (!embedUrl) return <DownloadFallbackCard resource={resource} />;
      return <YouTubePreview embedUrl={embedUrl} title={resource.title} />;
    }
    case "gdoc":
    case "gslide":
    case "gsheet":
    case "gdrive": {
      const embedUrl = getGoogleEmbedUrl(url, resource.resourceType);
      if (!embedUrl) return <DownloadFallbackCard resource={resource} />;
      return <GoogleEmbedPreview embedUrl={embedUrl} title={resource.title} />;
    }
    default:
      return <DownloadFallbackCard resource={resource} />;
  }
}
