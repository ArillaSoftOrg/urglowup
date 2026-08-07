import type { MetadataRoute } from "next";
import { INTL_LOCALES } from "@/lib/i18n-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://urglowup.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", ...INTL_LOCALES.map((l) => `/${l}/`)],
      disallow: [
        "/admin/",
        "/business/",
        "/account/",
        "/api/",
        "/login/",
        "/register/",
        "/forgot-password/",
        "/reset-password/",
        "/verify-email/",
        "/admin/mfa/",
        "/tr/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
