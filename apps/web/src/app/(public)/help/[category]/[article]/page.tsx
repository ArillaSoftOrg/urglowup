import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, AlertCircle } from "lucide-react";
import { HELP_CATEGORIES, getArticleBySlug } from "@/lib/help-content";
import { HelpFeedback } from "@/components/help/help-feedback";

interface PageProps {
  params: Promise<{ category: string; article: string }>;
}

export async function generateStaticParams() {
  return HELP_CATEGORIES.flatMap((cat) =>
    cat.articles.map((art) => ({
      category: cat.slug,
      article: art.slug,
    }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug, article: articleSlug } = await params;
  const result = getArticleBySlug(categorySlug, articleSlug);
  if (!result) return {};
  const { category, article } = result;
  return {
    title: `${article.title} | ${category.title} | UrGlowUp`,
    description: article.intro,
    alternates: { canonical: `/help/${category.slug}/${article.slug}` },
  };
}

export default async function HelpArticlePage({ params }: PageProps) {
  const { category: categorySlug, article: articleSlug } = await params;
  const result = getArticleBySlug(categorySlug, articleSlug);
  if (!result) notFound();

  const { category, article } = result;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Breadcrumb */}
      <nav
        aria-label="Gezinme yolu"
        className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
      >
        <Link href="/help" className="transition hover:text-foreground">
          Yardım Merkezi
        </Link>
        <ChevronRight className="size-3.5 shrink-0" aria-hidden />
        <Link
          href={`/help/${category.slug}`}
          className="transition hover:text-foreground"
        >
          {category.title}
        </Link>
        <ChevronRight className="size-3.5 shrink-0" aria-hidden />
        <span className="font-medium text-foreground">{article.title}</span>
      </nav>

      {/* Title & intro */}
      <div className="mb-8 space-y-3">
        <h1>{article.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          {article.intro}
        </p>
      </div>

      {/* Possible causes */}
      {article.causes && article.causes.length > 0 && (
        <section className="mb-8" aria-labelledby="causes-heading">
          <h2 id="causes-heading" className="mb-3">
            Olası nedenler
          </h2>
          <ul className="space-y-2">
            {article.causes.map((cause) => (
              <li key={cause} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0 text-warning"
                  aria-hidden
                />
                {cause}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Step-by-step fixes */}
      <section aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="mb-5">
          Adım adım çözüm
        </h2>
        <ol className="space-y-6">
          {article.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span
                aria-hidden
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-cream text-xs font-semibold tabular-nums text-foreground"
              >
                {i + 1}
              </span>
              <div className="space-y-1">
                <h3>{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Support CTA */}
      <div className="mt-10 rounded-2xl bg-surface-cream px-5 py-6">
        <p className="mb-1 text-sm font-semibold">Hâlâ sorun yaşıyor musunuz?</p>
        <p className="mb-4 text-sm text-muted-foreground">
          Destek ekibimiz iş günlerinde 24 saat içinde yanıt verir.
        </p>
        <a
          href="mailto:destek@urglowup.com"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 text-sm font-medium transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Destek ekibine yaz
        </a>
      </div>

      {/* Feedback */}
      <div className="mt-8 border-t border-border/40 pt-6">
        <HelpFeedback />
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link
          href={`/help/${category.slug}`}
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← {category.title} konularına dön
        </Link>
      </div>
    </div>
  );
}
