export function PdfPreview({ url, title }: { url: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-muted">
      <iframe src={url} title={title} className="h-[75vh] w-full" loading="lazy" />
    </div>
  );
}
