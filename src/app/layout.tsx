import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://urglowup.vercel.app"
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
  return (
    <ClerkProvider>
      <html lang={locale} className={`${inter.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}
