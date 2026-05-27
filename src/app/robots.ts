import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://urglowup.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/en/", "/de/", "/ru/", "/es/", "/bg/"],
      disallow: [
        "/admin/",
        "/business/",
        "/account/",
        "/api/",
        "/login/",
        "/register/",
        "/tr/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
