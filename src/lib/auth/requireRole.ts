import "server-only";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { verifySession } from "./session";
import type { SessionPayload, UserRole } from "@/types/session";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Resolve the session from a Route Handler's `NextRequest`. */
export async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Resolve the session from `next/headers` — for Server Components / layouts. */
export async function getSessionFromCookieStore(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Throws `AuthError` (401/403) if the request isn't authenticated with an allowed role. */
export async function requireRole(
  request: NextRequest,
  allowed: UserRole[]
): Promise<SessionPayload> {
  const session = await getSession(request);
  if (!session) throw new AuthError("Authentication required.", 401);
  if (!allowed.includes(session.role)) throw new AuthError("Forbidden.", 403);
  return session;
}

/** Converts an `AuthError` into a JSON response; returns null for any other error. */
export function authErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}

/** Standard catch-all for Route Handlers: preserves AuthError status, logs and 500s otherwise. */
export function apiErrorResponse(error: unknown, fallbackMessage: string): NextResponse {
  const authResponse = authErrorResponse(error);
  if (authResponse) return authResponse;
  console.error(fallbackMessage, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
