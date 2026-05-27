import type { Metadata } from "next";
import { headers, cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://urglowup.vercel.app",
  ),
  title: {
    default: "UrGlowUp",
    template: "%s | UrGlowUp",
  },
  description:
    "Discover beauty and personal care businesses, view real work, and request appointments with confidence.",
  openGraph: {
    siteName: "UrGlowUp",
    type: "website",
    locale: "tr_TR",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const locale = h.get("x-locale") ?? "tr";

  const jar = await cookies();
  const themeCookie = jar.get("ugl_theme")?.value ?? "SYSTEM";
  const isDark =
    themeCookie === "DARK" ? true : themeCookie === "LIGHT" ? false : null;

  return (
    <html
      lang={locale}
      className={`h-full antialiased${isDark === true ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <head>
        {/* Blocking script: resolves SYSTEM mode and prevents dark-mode flash before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=document.cookie.match(/(?:^|; )ugl_theme=([^;]*)/);var theme=t?decodeURIComponent(t[1]):'SYSTEM';if(theme==='DARK'||(theme==='SYSTEM'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
