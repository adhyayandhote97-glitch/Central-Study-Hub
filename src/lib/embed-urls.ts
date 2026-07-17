import type { ResourceType } from "@/types/resource";

export function getYouTubeEmbedUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  let videoId: string | null = null;
  if (parsed.hostname.includes("youtu.be")) {
    videoId = parsed.pathname.slice(1) || null;
  } else if (parsed.searchParams.has("v")) {
    videoId = parsed.searchParams.get("v");
  } else {
    videoId =
      parsed.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/)?.[1] ??
      parsed.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/)?.[1] ??
      null;
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

export function getGoogleEmbedUrl(url: string, type: ResourceType): string | null {
  const id = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  if (!id) return null;

  switch (type) {
    case "gdoc":
      return `https://docs.google.com/document/d/${id}/preview`;
    case "gslide":
      return `https://docs.google.com/presentation/d/${id}/embed`;
    case "gsheet":
      return `https://docs.google.com/spreadsheets/d/${id}/preview`;
    default:
      return null;
  }
}
