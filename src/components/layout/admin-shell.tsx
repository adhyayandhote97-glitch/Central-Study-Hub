"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, LogOut, Menu, ShieldCheck } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { ADMIN_NAV_ITEMS } from "./admin-nav-items";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/theme-toggle";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 px-3">
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                : "font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandMark() {
  return (
    <Link href="/admin" className="flex items-center gap-2 px-1 font-semibold tracking-tight text-sidebar-foreground">
      <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <GraduationCap className="size-4.5" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm">Central Study Hub</span>
        <span className="text-[11px] font-normal text-sidebar-foreground/60">Admin console</span>
      </span>
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-1 bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar py-4 lg:flex">
        <div className="mb-6 px-3">
          <BrandMark />
        </div>
        <AdminNavLinks />
        <div className="mt-auto flex flex-col gap-2 border-t border-sidebar-border px-3 pt-4">
          <div className="flex items-center justify-between px-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sidebar-foreground/70">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Administrator
            </span>
            <ThemeToggle />
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="justify-start gap-2">
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open admin navigation">
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col bg-sidebar text-sidebar-foreground">
              <SheetHeader>
                <SheetTitle className="text-sidebar-foreground">
                  <BrandMark />
                </SheetTitle>
              </SheetHeader>
              <AdminNavLinks onNavigate={() => setOpen(false)} />
              <div className="mt-auto flex flex-col gap-2 border-t border-sidebar-border px-3 pb-4 pt-3">
                <Button variant="outline" size="sm" onClick={handleLogout} className="justify-start gap-2">
                  <LogOut className="size-4" aria-hidden="true" />
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-foreground">Admin console</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
