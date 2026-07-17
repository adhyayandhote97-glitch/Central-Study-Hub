import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { verifySession } from "@/lib/auth/session";

// Edge runtime: this file (and everything it imports) must stay
// firebase-admin-free. `lib/auth/session.ts` only pulls in `jose`, which is
// Edge-safe.

function isAdminOnlyPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/upload")
  );
}

function isDashboardPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api");
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  const requiresAdmin = isAdminOnlyPath(pathname);
  const requiresAnyRole = requiresAdmin || isDashboardPath(pathname) || isApi;

  if (!requiresAnyRole) {
    return NextResponse.next();
  }

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (requiresAdmin && session.role !== "admin") {
    if (isApi) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/api/:path*"],
};
