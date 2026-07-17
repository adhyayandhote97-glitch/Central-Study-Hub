import { redirect } from "next/navigation";
import { getSessionFromCookieStore } from "@/lib/auth/requireRole";
import { AdminShell } from "@/components/layout/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookieStore();

  if (!session || session.role !== "admin") {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}
