import type { Metadata } from "next";
import Link from "next/link";
import {
  UserCircle,
  Camera,
  Sparkles,
  CreditCard,
  Shield,
  Flag,
} from "lucide-react";
import { HELP_CATEGORIES, buildSearchIndex } from "@/lib/help-content";
import { HelpSearch } from "@/components/help/help-search";

export const metadata: Metadata = {
  title: "Yardım Merkezi | UrGlowUp",
  description:
    "Sık sorulan sorular ve adım adım rehberlerle hesabınızı, analizlerinizi ve aboneliğinizi kolayca yönetin.",
  alternates: { canonical: "/help" },
};

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  UserCircle,
  Camera,
  Sparkles,
  CreditCard,
  Shield,
  Flag,
};

const CATEGORY_COLORS: Record<string, string> = {
  "account-login": "bg-surface-pink text-brand-pink-foreground",
  "photo-analysis": "bg-surface-purple text-brand-purple-foreground",
  "results-recommendations": "bg-surface-cream text-foreground",
  "subscription-payments": "bg-info/10 text-info-foreground",
  "privacy-security": "bg-success/10 text-success-foreground",
  "report-problem": "bg-neutral/60 text-neutral-foreground",
};

const FEATURED_ARTICLES = [
  { categorySlug: "account-login", articleSlug: "forgot-password", label: "Şifremi unuttum" },
  { categorySlug: "account-login", articleSlug: "cannot-login", label: "Giriş yapamıyorum" },
  { categorySlug: "photo-analysis", articleSlug: "cannot-upload-photo", label: "Fotoğraf yüklenemiyor" },
  { categorySlug: "results-recommendations", articleSlug: "what-is-glow-score", label: "Glow Score nedir?" },
  { categorySlug: "subscription-payments", articleSlug: "cancel-subscription", label: "Abonelik iptali" },
];

export default function HelpPage() {
  const searchIndex = buildSearchIndex();

  return (
    <>
      {/* Hero / search */}
      <section className="bg-surface-cream px-4 py-14 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Yardım Merkezi
          </p>
          <h1 className="mb-3 text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            Size nasıl yardımcı olabiliriz?
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground md:text-base">
            Sık sorulan sorulara göz atın ya da arama kutusunu kullanarak cevabı hızla bulun.
          </p>
          <div className="flex justify-center">
            <HelpSearch index={searchIndex} />
          </div>
        </div>
      </section>

      {/* Featured topics */}
      <section className="border-b border-border/40 px-4 py-6">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Sık sorulanlar
          </p>
          <div className="flex flex-wrap gap-2">
            {FEATURED_ARTICLES.map((fa) => (
              <Link
                key={`${fa.categorySlug}/${fa.articleSlug}`}
                href={`/help/${fa.categorySlug}/${fa.articleSlug}`}
                className="rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm text-muted-foreground transition hover:border-border hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {fa.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category grid */}
      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-6 text-xl font-semibold tracking-[-0.015em]">
            Konular
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HELP_CATEGORIES.map((cat) => {
              const Icon = ICON_MAP[cat.icon] ?? Flag;
              const iconColor = CATEGORY_COLORS[cat.slug] ?? "bg-muted text-foreground";
              return (
                <Link
                  key={cat.slug}
                  href={`/help/${cat.slug}`}
                  className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-background p-5 transition hover:border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div
                    className={`inline-flex size-10 items-center justify-center rounded-lg ${iconColor}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-semibold leading-snug tracking-[-0.01em] group-hover:text-foreground">
                      {cat.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {cat.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground/60">
                    {cat.articles.length} makale
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-surface-cream px-6 py-8 text-center md:py-10">
            <h2 className="mb-2 text-lg font-semibold tracking-[-0.015em]">
              Aradığınızı bulamadınız mı?
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Destek ekibimiz iş günlerinde 24 saat içinde yanıt verir.
            </p>
            <a
              href="mailto:destek@urglowup.com"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-background px-4 text-sm font-medium transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Destek ekibine yaz
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
