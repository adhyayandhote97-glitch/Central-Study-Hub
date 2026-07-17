export function YouTubePreview({ embedUrl, title }: { embedUrl: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-black">
      <iframe
        src={embedUrl}
        title={title}
        className="aspect-video w-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
