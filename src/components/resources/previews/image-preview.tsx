import Image from "next/image";

export function ImagePreview({ url, title }: { url: string; title: string }) {
  return (
    <div className="relative flex max-h-[75vh] w-full items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
      <Image
        src={url}
        alt={title}
        width={1600}
        height={1000}
        className="h-auto max-h-[75vh] w-auto max-w-full object-contain"
        sizes="(max-width: 768px) 100vw, 800px"
        priority
      />
    </div>
  );
}
