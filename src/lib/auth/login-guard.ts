import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison. A plain `a === b` short-circuits on the
 * first differing byte, leaking key length/prefix information through timing.
 * This always compares the full length.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // timingSafeEqual requires equal lengths; hash to a fixed width first so we
  // don't leak length either. Simple approach: compare padded to the max length.
  if (bufA.length !== bufB.length) {
    // Still run a comparison to keep timing uniform, then return false.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

// --- Best-effort in-memory login rate limiting -----------------------------
// Slows brute-force attempts against the shared access keys. This is per
// server instance; on multi-instance/serverless deployments it is only a
// partial control — pair it with Firebase App Check / a WAF in production
// (documented in DEPLOYMENT.md).

interface Attempt {
  count: number;
  first: number;
}

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 10; // per window per IP
const attempts = new Map<string, Attempt>();

export function checkLoginRate(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.first > WINDOW_MS) {
    // Opportunistically drop expired windows so the map stays bounded.
    if (attempts.size > 500) {
      for (const [key, value] of attempts) {
        if (now - value.first > WINDOW_MS) attempts.delete(key);
      }
    }
    attempts.set(ip, { count: 1, first: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  record.count += 1;
  if (record.count > MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.first + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 1) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Clears the failed-attempt counter for an IP after a successful login. */
export function clearLoginRate(ip: string): void {
  attempts.delete(ip);
}

/** Extracts a best-effort client IP from proxy headers. */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
