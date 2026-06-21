import Link from "next/link";
import {
  ChevronDown,
  Globe2,
  Languages,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { CookieSettingsButton } from "@/components/layout/cookie-settings-button";
import { SocialIcon } from "@/components/shared/social-icons";

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
  { label: "Instagram", href: "#", icon: "instagram" },
  { label: "TikTok", href: "#", icon: "tiktok" },
  { label: "LinkedIn", href: "#", icon: "linkedin" },
  { label: "YouTube", href: "#", icon: "youtube" },
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
                {socialLinks.map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="text-muted-foreground transition-colors duration-200 hover:text-brand-purple-foreground"
                  >
                    <SocialIcon name={social.icon} className="h-5 w-5" />
                  </Link>
                ))}
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
