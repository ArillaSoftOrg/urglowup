import type { NextConfig } from "next";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// Content-Security-Policy. Enforced by default (the header is
// `Content-Security-Policy`, which blocks disallowed sources). Set the
// emergency rollback flag CSP_REPORT_ONLY=true to fall back to
// `Content-Security-Policy-Report-Only` (violations reported, nothing blocked).
// 'unsafe-inline' is required for now by the app's first-party inline scripts
// (theme toggle + JSON-LD) and injected styles (Tailwind v4 + Google Maps).
const isDev = process.env.NODE_ENV === "development";
const cspReportOnly = process.env.CSP_REPORT_ONLY === "true";

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // React uses eval() only in development for enhanced debugging.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://maps.googleapis.com https://maps.gstatic.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://img.clerk.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com",
  "font-src 'self' data:",
  "connect-src 'self' https://maps.googleapis.com https://*.googleapis.com https://challenges.cloudflare.com https://res.cloudinary.com",
  "frame-src https://challenges.cloudflare.com",
  "media-src 'self' https://res.cloudinary.com blob: data:",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
];

const cspHeaderValue = cspDirectives.join("; ");
const cspHeaderKey = cspReportOnly
  ? "Content-Security-Policy-Report-Only"
  : "Content-Security-Policy";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: cloudName
      ? [
          {
            protocol: "https",
            hostname: "res.cloudinary.com",
            pathname: `/${cloudName}/**`,
          },
          {
            protocol: "https",
            hostname: "img.clerk.com",
            pathname: "/**",
          },
        ]
      : [
          {
            protocol: "https",
            hostname: "img.clerk.com",
            pathname: "/**",
          },
        ],
    qualities: [75],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: cspHeaderKey,
            value: cspHeaderValue,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
