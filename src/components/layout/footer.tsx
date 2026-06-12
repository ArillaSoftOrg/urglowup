import Link from "next/link";
import type { ComponentProps } from "react";
import {
  Apple,
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Globe2,
  Headphones,
  Languages,
  LockKeyhole,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
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
    icon: Search,
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
    icon: Store,
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
    heading: "Hesap",
    icon: UserRound,
    links: [
      { label: "Giriş Yap", href: "/login" },
      { label: "Kayıt Ol", href: "/register" },
      { label: "Randevularım", href: "/account/appointments" },
      { label: "Favorilerim", href: "/account/favorites" },
      { label: "Yardım Merkezi", href: "/help" },
      { label: "Bize Ulaşın", href: "/help" },
    ],
  },
] as const;

const legalLinks = [
  { label: "Gizlilik Politikası", href: "/privacy-policy" },
  { label: "KVKK Aydınlatma Metni", href: "/kvkk" },
  { label: "Çerez Politikası", href: "/cookie-policy" },
  { label: "Kullanım Koşulları", href: "/kullanim-kosullari" },
  { label: "KVKK Başvuru Formu", href: "/kvkk-basvuru" },
] as const;

const socialLinks = [
  { label: "Instagram", href: "#", icon: InstagramIcon },
  {
    label: "TikTok",
    href: "#",
    icon: TikTokIcon,
  },
  { label: "LinkedIn", href: "#", icon: LinkedInIcon },
  { label: "YouTube", href: "#", icon: YoutubeIcon },
] as const;

const trustItems = [
  {
    title: "Güvenli Altyapı",
    description: "Verileriniz 256-bit SSL ile korunur.",
    icon: LockKeyhole,
  },
  {
    title: "Doğrulanmış İşletmeler",
    description: "Tüm salonlar özenle doğrulanır.",
    icon: BadgeCheck,
  },
  {
    title: "7/24 Destek",
    description: "Her zaman yanınızda olmaya hazırız.",
    icon: Headphones,
  },
  {
    title: "Kolay & Hızlı",
    description: "Randevunuzu saniyeler içinde oluşturun.",
    icon: ShieldCheck,
  },
] as const;

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex min-h-8 items-center justify-between gap-3 text-[15px] font-medium text-slate-700 transition-colors duration-200 hover:text-violet-700"
    >
      <span>{label}</span>
      <ChevronRight
        aria-hidden="true"
        className="h-4 w-4 text-violet-600 transition-transform duration-200 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

function StoreButton({
  icon: Icon,
  eyebrow,
  label,
}: {
  icon: typeof Apple;
  eyebrow: string;
  label: string;
}) {
  return (
    <Link
      href="#"
      className="flex h-11 min-w-36 items-center gap-2 rounded-md bg-slate-950 px-3 text-slate-50 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-900"
    >
      <Icon aria-hidden="true" className="h-6 w-6 shrink-0" />
      <span className="grid text-left leading-none">
        <span className="text-[10px] font-medium">{eyebrow}</span>
        <span className="mt-0.5 text-sm font-semibold">{label}</span>
      </span>
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="bg-[oklch(0.985_0.008_300)] px-3 pb-4 pt-10 text-slate-950 md:px-6 md:pt-14">
      <div className="mx-auto max-w-[1800px] overflow-hidden rounded-t-2xl border border-violet-200/80 border-t-4 border-t-violet-600 bg-[oklch(0.992_0.006_300)] shadow-[0_22px_70px_oklch(0.42_0.12_300/0.10)]">
        <div className="px-6 py-8 sm:px-8 md:px-10 lg:px-16 lg:py-12">
          <div className="grid gap-9 lg:grid-cols-[1.28fr_3.45fr] lg:gap-14">
            <div className="space-y-7">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 text-3xl font-extrabold tracking-normal text-slate-950"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full text-violet-700">
                    <Sparkles aria-hidden="true" className="h-10 w-10" />
                  </span>
                  <span>
                    Ur<span className="text-violet-700">Glow</span>Up
                  </span>
                </Link>
                <p className="mt-6 max-w-xs text-lg leading-8 text-slate-800">
                  Güzellik, bakım ve wellness hizmetlerini keşfet. Yakındaki
                  uzmanlardan kolayca randevu al.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <Link
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="flex h-14 w-14 items-center justify-center rounded-full border border-violet-200 bg-white/80 text-violet-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50"
                    >
                      <Icon aria-hidden="true" className="h-6 w-6" />
                    </Link>
                  );
                })}
              </div>

              <div>
                <p className="text-lg font-extrabold text-slate-950">
                  Uygulamamızı İndirin
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <StoreButton
                    icon={Apple}
                    eyebrow="App Store'dan"
                    label="İndirin"
                  />
                  <StoreButton
                    icon={Play}
                    eyebrow="Google Play"
                    label="DEN ALIN"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5 shadow-sm">
                <div className="flex gap-3.5">
                  <Store
                    aria-hidden="true"
                    className="mt-1 h-11 w-11 shrink-0 text-violet-700"
                  />
                  <div>
                    <p className="text-base font-extrabold leading-7 text-violet-700">
                      İşletmenizi UrGlowUp&apos;a ekleyin
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Daha fazla müşteriye ulaşın, randevularınızı kolayca
                      yönetin.
                    </p>
                    <Link
                      href="/business/register"
                      className="mt-4 inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-lg bg-violet-700 px-4 text-sm font-extrabold text-white shadow-md shadow-violet-700/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-800"
                    >
                      Ücretsiz İşletme Kaydı
                      <ChevronRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4 xl:gap-11">
              {footerColumns.map((col) => {
                const Icon = col.icon;
                return (
                  <div key={col.heading}>
                    <div className="flex items-center gap-4">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                        <Icon aria-hidden="true" className="h-7 w-7" />
                      </span>
                      <p className="text-xl font-extrabold text-slate-950">
                        {col.heading}
                      </p>
                    </div>
                    <ul className="mt-7 space-y-3">
                      {col.links.map((link) => (
                        <li key={link.label}>
                          <FooterLink href={link.href} label={link.label} />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              <div>
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                    <ShieldCheck aria-hidden="true" className="h-7 w-7" />
                  </span>
                  <p className="text-xl font-extrabold text-slate-950">
                    Yasal
                  </p>
                </div>
                <ul className="mt-7 space-y-3">
                  {legalLinks.map((link) => (
                    <li key={link.label}>
                      <FooterLink href={link.href} label={link.label} />
                    </li>
                  ))}
                  <li>
                    <div className="flex min-h-8 items-center justify-between gap-3">
                      <CookieSettingsButton label="Çerez Ayarları" />
                      <ChevronRight
                        aria-hidden="true"
                        className="h-4 w-4 text-violet-600"
                      />
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.28fr_3.45fr] lg:items-center">
            <div className="hidden lg:block" />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex gap-4 border-violet-200/80 xl:border-l xl:pl-8"
                  >
                    <Icon
                      aria-hidden="true"
                      className="mt-1 h-11 w-11 shrink-0 text-violet-700"
                    />
                    <div>
                      <p className="font-extrabold text-slate-950">
                        {item.title}
                      </p>
                      <p className="mt-2 text-[15px] leading-7 text-slate-700">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-violet-200/80 px-6 py-7 sm:px-8 md:px-10 lg:px-16">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-sm leading-7 text-slate-700">
              <p>
                © {new Date().getFullYear()} UrGlowUp. Tüm hakları saklıdır.
              </p>
              <p>
                Türkiye&apos;de güzellik ve bakım hizmetleri için randevu platformu.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-700">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-md px-2 transition-colors hover:bg-violet-50 hover:text-violet-700"
              >
                <Globe2 aria-hidden="true" className="h-5 w-5" />
                Türkiye
                <ChevronDown aria-hidden="true" className="h-4 w-4" />
              </button>
              <span className="hidden h-10 w-px bg-violet-200 sm:block" />
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-md px-2 transition-colors hover:bg-violet-50 hover:text-violet-700"
              >
                <Languages aria-hidden="true" className="h-5 w-5" />
                Türkçe
                <ChevronDown aria-hidden="true" className="h-4 w-4" />
              </button>
              <span className="hidden h-10 w-px bg-violet-200 sm:block" />
              <div className="flex items-center gap-3">
                <span className="rounded-md border border-violet-100 bg-white px-3 py-2 text-base font-black italic text-blue-800">
                  VISA
                </span>
                <span className="rounded-md border border-violet-100 bg-white px-3 py-2 text-base font-black text-orange-600">
                  ●●
                </span>
                <span className="rounded-md border border-violet-100 bg-white px-3 py-2 text-base font-black text-emerald-700">
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
