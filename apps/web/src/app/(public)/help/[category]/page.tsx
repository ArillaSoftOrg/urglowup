import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { HELP_CATEGORIES, getCategoryBySlug } from "@/lib/help-content";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return HELP_CATEGORIES.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) return {};
  return {
    title: `${category.title} | Yardım Merkezi | UrGlowUp`,
    description: category.description,
    alternates: { canonical: `/help/${category.slug}` },
  };
}

export default async function HelpCategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Breadcrumb */}
      <nav aria-label="Gezinme yolu" className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/help" className="hover:text-foreground transition">
          Yardım Merkezi
        </Link>
        <ChevronRight className="size-3.5 shrink-0" aria-hidden />
        <span className="font-medium text-foreground">{category.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 space-y-2">
        <h1>{category.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {category.description}
        </p>
      </div>

      {/* Article list */}
      <ul className="space-y-3" role="list">
        {category.articles.map((article) => {
          const firstSentence = article.intro.split(/[.!?]/)[0];
          return (
            <li key={article.slug}>
              <Link
                href={`/help/${category.slug}/${article.slug}`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background p-4 transition hover:border-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium leading-snug text-foreground">
                    {article.title}
                  </p>
                  {firstSentence && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {firstSentence}.
                    </p>
                  )}
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground/50 transition group-hover:text-muted-foreground"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Back link */}
      <div className="mt-10 border-t border-border/40 pt-6">
        <Link
          href="/help"
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← Tüm konulara dön
        </Link>
      </div>
    </div>
  );
}
