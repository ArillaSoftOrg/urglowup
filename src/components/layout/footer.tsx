import Link from "next/link";
import type { ComponentProps } from "react";
import {
  ChevronDown,
  Globe2,
  Languages,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { CookieSettingsButton } from "@/components/layout/cookie-settings-button";

function InstagramIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M7.8 2.8h8.4c2.8 0 5 2.2 5 5v8.4c0 2.8-2.2 5-5 5H7.8c-2.8 0-5-2.2-5-5V7.8c0-2.8 2.2-5 5-5Zm0 2.2a2.8 2.8 0 0 0-2.8 2.8v8.4A2.8 2.8 0 0 0 7.8 19h8.4a2.8 2.8 0 0 0 2.8-2.8V7.8A2.8 2.8 0 0 0 16.2 5H7.8Zm4.2 3.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2Zm0 2.1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm4.1-2.4a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TikTokIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M15.8 3.2c.3 2.4 1.7 4 4 4.4v3.2a7.4 7.4 0 0 1-4-1.2v5.8c0 3.5-2.4 5.7-5.7 5.7-3.1 0-5.5-2.1-5.5-5.1 0-3.2 2.5-5.2 5.6-5.2.5 0 .9.1 1.3.2v3.3a3 3 0 0 0-1.2-.2c-1.4 0-2.4.8-2.4 1.9s.9 1.9 2.2 1.9c1.4 0 2.3-.8 2.3-2.4V3.2h3.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function YoutubeIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M21.4 7.2a3 3 0 0 0-2.1-2.1C17.5 4.6 12 4.6 12 4.6s-5.5 0-7.3.5a3 3 0 0 0-2.1 2.1A31.2 31.2 0 0 0 2.1 12c0 1.6.1 3.2.5 4.8a3 3 0 0 0 2.1 2.1c1.8.5 7.3.5 7.3.5s5.5 0 7.3-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-3.2.5-4.8s-.1-3.2-.5-4.8ZM10 15.5v-7l6 3.5-6 3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkedInIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M6.4 8.8H3.2v11.4h3.2V8.8ZM4.8 3.6a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8Zm7.1 5.2H8.8v11.4H12v-5.9c0-1.6.7-2.7 2.1-2.7 1.2 0 1.8.8 1.8 2.5v6.1h3.2v-6.7c0-3.3-1.7-5-4.3-5-1.6 0-2.6.8-3 1.6V8.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

const footerColumns = [
  {
    heading: "Keşfet",
    links: [
      { label: "Tüm Uzmanlar", href: "/explore" },
      { label: "Kategoriler", href: "/explore" },
      { label: "Yakınımdaki Salonlar", href: "/map" },
      { label: "Popüler Hizmetler", href: "/styles" },
      { label: "Kampanyalar", href: "/deals" },
      { label: "Blog", href: "/styles" },
    ],
  },
  {
    heading: "İşletmeler",
    links: [
      { label: "İşletmeler İçin", href: "/for-business" },
      { label: "İşletme Kaydı", href: "/business/register" },
      { label: "Salon Paneli", href: "/business/dashboard" },
      { label: "Fiyatlandırma", href: "/for-business#pricing" },
      { label: "İşletme Yardım Merkezi", href: "/help" },
      { label: "Başarı Hikayeleri", href: "/for-business#stories" },
    ],
  },
  {
    heading: "Destek & Yasal",
    showCookieButton: true as const,
    links: [
      { label: "Yardım Merkezi", href: "/help" },
      { label: "Bize Ulaşın", href: "/help" },
      { label: "Gizlilik Politikası", href: "/privacy-policy" },
      { label: "KVKK Aydınlatma Metni", href: "/kvkk" },
      { label: "Çerez Politikası", href: "/cookie-policy" },
      { label: "Kullanım Koşulları", href: "/kullanim-kosullari" },
    ],
  },
] as const;

const socialLinks = [
  { label: "Instagram", href: "#", icon: InstagramIcon },
  { label: "TikTok", href: "#", icon: TikTokIcon },
  { label: "LinkedIn", href: "#", icon: LinkedInIcon },
  { label: "YouTube", href: "#", icon: YoutubeIcon },
] as const;

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-[15px] font-medium text-foreground/70 transition-colors duration-200 hover:text-brand-purple-foreground"
    >
      {label}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="bg-surface-purple px-3 pb-4 pt-10 md:px-6 md:pt-14">
      <div className="mx-auto max-w-[1800px] overflow-hidden rounded-t-2xl border border-brand-purple/20 border-t-4 border-t-brand-purple-foreground bg-background shadow-lg">
        <div className="px-6 py-5 sm:px-8 md:px-10 lg:px-16 lg:py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_2.8fr] lg:gap-10">
            {/* Brand + social */}
            <div className="space-y-5 lg:pt-1">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 text-3xl font-extrabold tracking-normal text-foreground"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full text-brand-purple-foreground">
                    <Sparkles aria-hidden="true" className="h-10 w-10" />
                  </span>
                  <span>
                    Ur<span className="text-brand-purple-foreground">Glow</span>Up
                  </span>
                </Link>
                <p className="mt-4 max-w-xs text-[15px] leading-7 text-muted-foreground">
                  Güzellik, bakım ve wellness hizmetlerini keşfet. Yakındaki
                  uzmanlardan kolayca randevu al.
                </p>
              </div>

              <div className="flex gap-5">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <Link
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="text-muted-foreground transition-colors duration-200 hover:text-brand-purple-foreground"
                    >
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Navigation columns + trust row */}
            <div className="space-y-6">
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
                {footerColumns.map((col) => (
                  <div key={col.heading}>
                    <p className="mb-4 text-base font-extrabold text-foreground">
                      {col.heading}
                    </p>
                    <ul className="space-y-2">
                      {col.links.map((link) => (
                        <li key={link.label}>
                          <FooterLink href={link.href} label={link.label} />
                        </li>
                      ))}
                      {"showCookieButton" in col && col.showCookieButton && (
                        <li>
                          <CookieSettingsButton label="Çerez Ayarları" />
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Compact trust row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-brand-purple/10 pt-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5 text-brand-purple-foreground" />
                  Güvenli ödemeler
                </span>
                <span aria-hidden="true" className="text-brand-purple/30">·</span>
                <span>Doğrulanmış işletmeler</span>
                <span aria-hidden="true" className="text-brand-purple/30">·</span>
                <span>Hızlı rezervasyon</span>
                <span aria-hidden="true" className="text-brand-purple/30">·</span>
                <span>Destek merkezi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-brand-purple/10 px-6 py-5 sm:px-8 md:px-10 lg:px-16">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-sm leading-6 text-muted-foreground">
              <p>© {new Date().getFullYear()} UrGlowUp. Tüm hakları saklıdır.</p>
              <p>Türkiye&apos;de güzellik ve bakım hizmetleri için randevu platformu.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-foreground/70">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-md px-2 transition-colors hover:bg-surface-purple hover:text-brand-purple-foreground"
              >
                <Globe2 aria-hidden="true" className="h-5 w-5" />
                Türkiye
                <ChevronDown aria-hidden="true" className="h-4 w-4" />
              </button>
              <span className="hidden h-10 w-px bg-brand-purple/20 sm:block" />
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-md px-2 transition-colors hover:bg-surface-purple hover:text-brand-purple-foreground"
              >
                <Languages aria-hidden="true" className="h-5 w-5" />
                Türkçe
                <ChevronDown aria-hidden="true" className="h-4 w-4" />
              </button>
              <span className="hidden h-10 w-px bg-brand-purple/20 sm:block" />
              <div className="flex items-center gap-3">
                <span className="rounded-md border border-border bg-card px-3 py-2 text-base font-black italic text-muted-foreground">
                  VISA
                </span>
                <span className="rounded-md border border-border bg-card px-3 py-2 text-base font-black text-muted-foreground">
                  ●●
                </span>
                <span className="rounded-md border border-border bg-card px-3 py-2 text-base font-black text-muted-foreground">
                  troy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
