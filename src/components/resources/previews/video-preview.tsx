export function VideoPreview({ url, title }: { url: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-black">
      <video src={url} controls preload="metadata" className="max-h-[75vh] w-full" title={title}>
        Your browser doesn&apos;t support embedded video playback.
      </video>
    </div>
  );
}
