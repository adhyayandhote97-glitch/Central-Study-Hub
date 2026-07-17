"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Search } from "@/components/icons";
import { cn } from "@/lib/utils";
import { STUDENT_NAV_ITEMS } from "./nav-items";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mr-2 flex items-center gap-2 rounded-md py-1.5 pr-2 font-semibold tracking-tight text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="size-4.5" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Central Study Hub</span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center gap-1 lg:flex"
        >
          {STUDENT_NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active
                    ? "font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-[6px]"
                    : "font-medium text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="ghost" size="icon" asChild aria-label="Search resources">
            <Link href="/dashboard/search">
              <Search className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <UserMenu />
          <div className="lg:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
