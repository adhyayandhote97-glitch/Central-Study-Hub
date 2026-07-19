# Security Overview & Audit

This document records the security posture of Central Study Hub: the controls
already in place, the hardening applied during the V2 review, and the residual
recommendations for a production deployment.

---

## 1. Architecture recap (the trust model)

Central Study Hub uses **two shared access keys** (a student key and an admin
key) rather than individual accounts. On login the server verifies the key,
mints a **per-device** Firebase identity via a custom token, and issues an
**HttpOnly session cookie**. Authorisation is enforced in **three independent
layers**, so a bypass of any one layer is still caught by the others:

1. **Edge middleware** (`src/middleware.ts`) — verifies the signed session
   cookie and blocks `/dashboard`, `/admin`, and `/api` before a request
   reaches any handler. Admin-only paths (`/admin`, `/api/admin`, `/api/upload`)
   additionally require `role === "admin"`.
2. **Server-side re-checks** — every API route calls `requireRole(...)`, and the
   admin layout re-verifies the role from the cookie. Middleware is treated as a
   fast filter, not the sole gate.
3. **Firestore & Storage security rules** — the database and file store enforce
   their own access control keyed on the authenticated `uid` and the `role`
   custom claim, so even a direct client SDK call is constrained.

---

## 2. Existing strengths (confirmed during the audit)

- **Session cookie** is `HttpOnly`, `SameSite=Lax`, `Secure` in production, and
  signed with `jose` (HS256). The signing secret is length-checked (≥ 32 chars)
  and never exposed to the client.
- **Edge/runtime separation** is clean: `firebase-admin` is never imported into
  the Edge middleware (only `jose`), avoiding secret leakage into the Edge bundle.
- **Firestore rules default-deny.** Every sensitive collection's writes are
  `if false` (mutations happen only through the Admin SDK in API routes, which
  bypass rules and add validation + activity logging). Reads are scoped: users
  can read only their own `users`, `tickets`, `favorites`, `recentViews`, and
  `downloads` documents; `analytics` and `ticketNotes` are admin-only.
- **Admin internal notes** are stored in a separate `ticketNotes` collection, not
  as a field on the student-readable ticket document — because Firestore rules
  are document-level, not field-level.
- **Storage rules deny all client writes.** Uploads are streamed through the
  Admin SDK server-side; the browser never holds a Storage write credential.
  (Firebase Storage is optional on this project — see `DEPLOYMENT.md` §0;
  `storage.rules` is simply inert on deployments that skip enabling Storage.)
- **Input validation** on every mutating route uses shared Zod schemas.
- **No XSS sinks:** no `dangerouslySetInnerHTML` on user content (the only use is
  shadcn's chart component injecting developer-defined CSS variables), and every
  `target="_blank"` link carries `rel="noopener noreferrer"`.
- **Secret hygiene:** only the public Firebase Web config is exposed via
  `NEXT_PUBLIC_*`; the Admin service account, session secret, and access keys
  are server-only.

---

## 3. Hardening applied in this review

### 3.1 Upload file-type allowlist — `src/lib/upload-validation.ts`
**Risk addressed:** Firebase Storage serves uploaded files back over HTTP. An
uploaded `.html` or `.svg` (which can contain script) served inline is a
stored-XSS / phishing vector, and executables are a malware vector. Size limits
alone don't stop this.
**Fix:** Both upload routes now validate the filename against an allowlist and a
hard denylist of active/executable extensions (`html`, `svg`, `js`, `exe`, `sh`,
`php`, …). Resource uploads (admin) accept documents, images, audio, and video;
ticket attachments (student) are restricted to **images and PDF only** — the
narrowest surface for the least-trusted uploader. Validation is server-side, so a
spoofed client MIME type cannot bypass it.

### 3.2 Security response headers — `next.config.ts`
**Risk addressed:** clickjacking, MIME-sniffing, referrer leakage, and unwanted
device (camera/mic/geolocation) access.
**Fix:** Every response now sends `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
and a locked-down `Permissions-Policy`. In **production** it additionally sends a
**Content-Security-Policy** (`frame-ancestors 'none'`, `object-src 'none'`,
`base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`, and
scoped `img/media/connect` sources for Firebase) plus **HSTS**
(`Strict-Transport-Security`, 2-year, `includeSubDomains; preload`). The CSP is
production-only so local Fast Refresh (which needs `unsafe-eval` and websockets)
is not broken.

### 3.3 Constant-time access-key comparison — `src/lib/auth/login-guard.ts`
**Risk addressed:** a plain `===` comparison of the submitted key against the
real key short-circuits on the first differing byte, leaking length/prefix
information through response timing.
**Fix:** Key comparison now uses `crypto.timingSafeEqual` via a `safeEqual`
helper that always compares the full length.

### 3.4 Login brute-force throttle — `src/lib/auth/login-guard.ts`
**Risk addressed:** because the keys are shared secrets (not per-user), they are
a natural brute-force target.
**Fix:** The login route now throttles to **10 attempts per IP per 5 minutes**,
returning `429` with a `Retry-After` header, and clears the counter on success.
This is an in-memory, best-effort control (per server instance) — see the
production recommendation in §4.

### 3.5 Firestore rules catch-all deny — `firestore.rules`
**Risk addressed:** a future collection added without a matching rule could be
unintentionally exposed.
**Fix:** A trailing `match /{document=**} { allow read, write: if false; }`
guarantees anything not explicitly matched is denied. (It uses Firestore's OR
semantics, so it never revokes the explicit grants above it — it only closes the
gap for unmatched paths.)

---

## 4. Residual recommendations for production

These are operational controls to layer on top of the code-level hardening:

- **Firebase App Check** — attest that requests come from your real app, not a
  script. This is the durable, multi-instance answer to brute force and API
  abuse (the in-memory throttle in §3.4 is per-instance and only a partial
  control on serverless/multi-instance hosting).
- **Rotate the access keys** before launch and on staff turnover; treat them as
  passwords, not URLs. Keys live in environment variables (see the Settings page
  and `DEPLOYMENT.md`), so rotation is a redeploy, not a code change.
- **Deploy the security rules** (`firebase deploy --only firestore:rules,storage`)
  — rules only protect production once deployed; the emulator uses them locally.
- **Monitoring & alerts** — enable Firebase/GCP budget alerts and review the
  Auth and Firestore usage dashboards for anomalies.
- **Keep the Admin service account key server-side only** — never commit it, and
  scope it to this project.
- **HTTPS everywhere** — Firebase Hosting provides managed certificates
  automatically; ensure the custom domain is served only over HTTPS (HSTS is
  already sent in production).
