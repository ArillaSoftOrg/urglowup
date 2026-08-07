import type { Metadata } from "next";

export const SITE_NAME = "UrGlowUp";
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://urglowup.vercel.app";

export const SITE_DESCRIPTION =
  "UrGlowUp ile güzellik ve kişisel bakım uzmanlarını keşfedin, gerçek işleri inceleyin, doğrulanmış yorumları okuyun ve güvenle randevu alın.";

export const SITE_KEYWORDS = [
  "UrGlowUp",
  "güzellik salonu",
  "kişisel bakım",
  "randevu al",
  "kuaför",
  "tırnak salonu",
  "cilt bakımı",
  "makyaj",
  "güzellik uzmanı",
];

export const privateRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}
