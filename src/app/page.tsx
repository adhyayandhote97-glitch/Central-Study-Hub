import { Suspense } from "react";
import { GraduationCap } from "@/components/icons";
import { AccessKeyForm } from "@/components/landing/access-key-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function LandingPage() {
  return (
    <main
      id="main-content"
      className="relative flex min-h-screen flex-1 flex-col bg-background px-5 py-8 sm:px-8 sm:py-12"
    >
      <div className="absolute top-5 right-5 z-10">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        {/* Masthead — the one place rules print: a thick–thin head pair
            bracketing the dateline rail, in full-strength ink. */}
        <header className="pt-6">
          <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-primary uppercase">
            <GraduationCap className="size-4" aria-hidden="true" weight="fill" />
            MYP5 Edition
          </p>

          <h1 className="mt-2 text-5xl leading-[0.95] font-semibold tracking-[-0.02em] text-foreground sm:text-7xl">
            Central Study Hub
          </h1>

          <div className="mt-4 h-[3px] w-full bg-foreground" />
          <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-[12px] tracking-[0.02em] text-muted-foreground">
            <span className="font-medium">Victorious Kidss Educares</span>
            <span>Continuously updated through the school year</span>
          </div>
          <div className="h-px w-full bg-border" />
        </header>

        {/* Lead — asymmetric, content hugs the left edge. */}
        <section className="grid flex-1 grid-cols-1 items-start gap-x-12 gap-y-10 pt-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-xl">
            <p className="text-2xl leading-snug text-foreground sm:text-3xl">
              Everything you need for MYP5.{" "}
              <span className="italic text-primary">One place.</span>
            </p>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Resources, announcements and study materials are kept current all
              year, so you always have the latest notes, past papers and updates
              in a single, calm place. No scattered folders, no lost links.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              Ask your Grade Ambassador if you don&apos;t have your access key.
            </p>
          </div>

          <div className="lg:justify-self-end">
            <Suspense fallback={null}>
              <AccessKeyForm />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}
