import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p>Central Study Hub · Victorious Kidss Educares · MYP5</p>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/dashboard/student-voice" className="hover:text-foreground">
            Student Voice
          </Link>
        </div>
      </div>
    </footer>
  );
}
