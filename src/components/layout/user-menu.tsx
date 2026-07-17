"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  History,
  Info,
  LogOut,
  Settings,
  ShieldCheck,
  User as UserIcon,
} from "@/components/icons";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const { role, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Open account menu"
        >
          {role === "admin" ? (
            <ShieldCheck className="size-4" aria-hidden="true" />
          ) : (
            <UserIcon className="size-4" aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">
            {role === "admin" ? "Administrator" : "Student"}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {role === "admin" ? "Full access to Central Study Hub" : "MYP5 access"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {role === "student" && (
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/favourites">
                <Heart aria-hidden="true" />
                My Favourites
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/recently-viewed">
                <History aria-hidden="true" />
                Recently Viewed
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/about">
                <Info aria-hidden="true" />
                About
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuGroup>
        )}
        <DropdownMenuItem asChild>
          <Link href={role === "admin" ? "/admin/settings" : "/dashboard/settings"}>
            <Settings aria-hidden="true" />
            Settings
          </Link>
        </DropdownMenuItem>
        {role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <UserIcon aria-hidden="true" />
              View Student Site
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOut aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
