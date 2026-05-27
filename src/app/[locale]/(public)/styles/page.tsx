import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAllStyleTags } from "@/lib/queries/style-tags";
import { db } from "@/lib/db";
import { StyleTagCard } from "@/components/explore/style-tag-card";
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const alternates = buildAlternates("/styles", locale);
  return {
    title: "Beauty & Care Style Guide | UrGlowUp",
    description:
      "Taper fade, fine line tattoo, French manicure and more. Get inspired with the UrGlowUp Style Guide and find the expert near you.",
    openGraph: {
      title: "Style Guide | UrGlowUp",
      description: "Get inspired and find the expert near you.",
      url: `/${locale}/styles`,
      locale: getOgLocale(locale),
    },
    alternates,
  };
}

export default async function LocaleStylesPage({ params }: PageProps) {
  const { locale } = await params;
  const p = (path: string) => `/${locale}${path}`;

  const [tags, categories] = await Promise.all([
    getAllStyleTags(),
    db.businessCategory.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const popularTags = [...tags]
    .filter((t) => t.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 6);

  const grouped = new Map<string, { categoryName: string; tags: typeof tags }>();
  const uncategorized: typeof tags = [];

  for (const tag of tags) {
    if (!tag.categoryId) { uncategorized.push(tag); continue; }
    const cat = categories.find((c) => c.id === tag.categoryId);
    if (!cat) { uncategorized.push(tag); continue; }
    if (!grouped.has(cat.id)) {
      grouped.set(cat.id, { categoryName: cat.name, tags: [] });
    }
    grouped.get(cat.id)!.tags.push(tag);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href={p("/")} className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3" />
        <Link href={p("/explore?tab=ilham")} className="hover:text-foreground">
          Inspiration
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">Style Guide</span>
      </nav>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Style Guide
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          What style are you imagining?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Pick a style, find your inspiration, and discover the expert near you.
        </p>
      </div>

      {tags.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          No style tags yet.
        </div>
      )}

      {popularTags.length >= 3 && (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Featured
            </p>
            <h2 className="mt-1 text-base font-semibold">Popular Styles</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {popularTags.map((tag) => (
              <StyleTagCard
                key={tag.id}
                name={tag.name}
                slug={tag.slug}
                postCount={tag.postCount}
                coverUrl={tag.coverUrl}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      {Array.from(grouped.entries()).map(([catId, group]) => (
        <section key={catId} className="space-y-4">
          <h2 className="text-base font-semibold">{group.categoryName}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {group.tags.map((tag) => (
              <StyleTagCard
                key={tag.id}
                name={tag.name}
                slug={tag.slug}
                postCount={tag.postCount}
                coverUrl={tag.coverUrl}
                locale={locale}
              />
            ))}
          </div>
        </section>
      ))}

      {uncategorized.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Other</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {uncategorized.map((tag) => (
              <StyleTagCard
                key={tag.id}
                name={tag.name}
                slug={tag.slug}
                postCount={tag.postCount}
                coverUrl={tag.coverUrl}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
