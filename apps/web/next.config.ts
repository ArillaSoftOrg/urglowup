import path from "path";
import type { NextConfig } from "next";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Monorepo: this app is nested under apps/web, and imports workspace packages
  // (@urglowup/db etc.) that ship untranspiled TypeScript source.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@urglowup/db", "@urglowup/domain", "@urglowup/validation"],
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
