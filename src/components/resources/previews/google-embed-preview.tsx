export function GoogleEmbedPreview({ embedUrl, title }: { embedUrl: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-muted">
      <iframe
        src={embedUrl}
        title={title}
        className="h-[75vh] w-full"
        loading="lazy"
        allow="autoplay"
      />
    </div>
  );
}
