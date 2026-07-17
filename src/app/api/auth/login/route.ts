import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { signSession, verifySession } from "@/lib/auth/session";
import { checkLoginRate, clearLoginRate, clientIpFrom, safeEqual } from "@/lib/auth/login-guard";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/constants";
import type { UserRole } from "@/types/session";

// firebase-admin is Node-only; also keeps the in-memory rate limiter on one runtime.
export const runtime = "nodejs";

const bodySchema = z.object({ passkey: z.string().min(1, "Enter your access key.").max(256) });

export async function POST(request: NextRequest) {
  // Best-effort brute-force throttle against the shared access keys.
  const ip = clientIpFrom(request.headers);
  const rate = checkLoginRate(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "An access key is required." }, { status: 400 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "The server isn't connected to Firebase yet. Ask an administrator to finish setup (see README).",
      },
      { status: 503 }
    );
  }

  const { passkey } = parsed.data;
  const adminKey = process.env.ADMIN_ACCESS_KEY;
  const studentKey = process.env.STUDENT_ACCESS_KEY;

  // Constant-time comparison avoids leaking key prefix/length via timing.
  let role: UserRole | null = null;
  if (adminKey && safeEqual(passkey, adminKey)) role = "admin";
  else if (studentKey && safeEqual(passkey, studentKey)) role = "student";

  if (!role) {
    return NextResponse.json({ error: "That access key isn't recognized." }, { status: 401 });
  }

  // Successful key match — reset this IP's throttle counter.
  clearLoginRate(ip);

  // Reuse the device uid from any existing session so per-device data
  // (favourites, recently viewed, tickets) survives a logout -> login cycle.
  const existingToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const existingSession = existingToken ? await verifySession(existingToken) : null;
  const uid = existingSession?.uid ?? crypto.randomUUID();

  let customToken: string;
  try {
    customToken = await getAdminAuth().createCustomToken(uid, { role });

    const now = new Date().toISOString();
    const userDoc: Record<string, unknown> = { uid, role, lastSeen: now };
    if (!existingSession) userDoc.createdAt = now;
    await getAdminDb().collection("users").doc(uid).set(userDoc, { merge: true });
  } catch (error) {
    console.error("Login failed while contacting Firebase:", error);
    return NextResponse.json(
      { error: "Couldn't reach Firebase. Please try again shortly." },
      { status: 503 }
    );
  }

  const sessionToken = await signSession({ uid, role });
  const response = NextResponse.json({ role, customToken });
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
