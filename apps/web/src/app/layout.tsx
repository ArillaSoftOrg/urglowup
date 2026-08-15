import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import { bootstrapEmailConfig } from "@/lib/email-bootstrap";
import { getDirection } from "@/lib/i18n-config";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo";
import { JsonLd } from "@/components/shared/json-ld";
import "./globals.css";

// Validate email config on startup
bootstrapEmailConfig();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "beauty",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const locale = h.get("x-locale") ?? "tr";
  const nonce = h.get("x-nonce") ?? undefined;
  const direction = getDirection(locale);

  const jar = await cookies();
  const themeCookie = jar.get("ugl_theme")?.value ?? "SYSTEM";
  const isDark =
    themeCookie === "DARK" ? true : themeCookie === "LIGHT" ? false : null;

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/favicon.ico"),
    sameAs: [],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/explore")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html
      lang={locale}
      dir={direction}
      className={`h-full antialiased${isDark === true ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <head>
        {/* Blocking script: resolves SYSTEM mode and prevents dark-mode flash before paint */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=document.cookie.match(/(?:^|; )ugl_theme=([^;]*)/);var theme=t?decodeURIComponent(t[1]):'SYSTEM';if(theme==='DARK'||(theme==='SYSTEM'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
