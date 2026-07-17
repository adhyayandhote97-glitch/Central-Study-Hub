import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Content Security Policy. Applied in production only — dev needs `'unsafe-eval'`
// and websocket connections for Fast Refresh, which we don't want in prod.
// `frame-ancestors 'none'`, `object-src 'none'` and `base-uri 'self'` are the
// high-value clauses (clickjacking + base-tag injection). `https:` on img/media/
// connect covers Firebase Auth/Firestore/Storage and admin-pasted resource URLs.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

// Sent on every response. These harden against clickjacking, MIME-sniffing,
// referrer leakage, and unwanted device access, and are safe in dev and prod.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ...(isProd
    ? [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Hide the floating circular Next.js dev indicator ("N" badge) — it's a
  // development-only overlay and should never distract from the UI.
  devIndicators: false,
  images: {
    // Resource thumbnails/images can live on any storage bucket the admin
    // configures (Firebase Storage varies per deployment) or be pasted as
    // arbitrary external URLs — allow any HTTPS host to be optimized.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
