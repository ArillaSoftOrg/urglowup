import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAllStyleTags } from "@/lib/queries/style-tags";
import { db } from "@/lib/db";
import { StyleTagCard } from "@/components/explore/style-tag-card";
import { buildAlternates } from "@/lib/i18n-metadata";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Güzellik & Bakım Stil Rehberi | UrGlowUp",
  description:
    "Taper fade, fine line dövme, Fransız manikür ve daha fazlası. UrGlowUp Stil Rehberi ile ilham alın, yakınındaki ustayı keşfedin.",
  alternates: buildAlternates("/styles", "tr"),
};

export default async function StylesPage() {
  const [tags, categories] = await Promise.all([
    getAllStyleTags(),
    db.businessCategory.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  // Featured: top tags by post count
  const popularTags = [...tags]
    .filter((t) => t.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 6);

  // Group remaining tags by category
  const grouped = new Map<string, { categoryName: string; tags: typeof tags }>();
  const uncategorized: typeof tags = [];

  for (const tag of tags) {
    if (!tag.categoryId) {
      uncategorized.push(tag);
      continue;
    }
    const cat = categories.find((c) => c.id === tag.categoryId);
    if (!cat) {
      uncategorized.push(tag);
      continue;
    }
    if (!grouped.has(cat.id)) {
      grouped.set(cat.id, { categoryName: cat.name, tags: [] });
    }
    grouped.get(cat.id)!.tags.push(tag);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Ana Sayfa
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/explore?tab=ilham" className="hover:text-foreground">
          İlham
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">Stil Rehberi</span>
      </nav>

      {/* Hero */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Stil Rehberi
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Nasıl bir stil hayal ediyorsun?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Bir stil seç, ilhamını bul ve yakınındaki ustayı keşfet.
        </p>
      </div>

      {tags.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Henüz stil etiketi yok.
        </div>
      )}

      {/* Popular styles */}
      {popularTags.length >= 3 && (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Öne Çıkan
            </p>
            <h2 className="mt-1 text-base font-semibold">Popüler Stiller</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {popularTags.map((tag) => (
              <StyleTagCard
                key={tag.id}
                name={tag.name}
                slug={tag.slug}
                postCount={tag.postCount}
                coverUrl={tag.coverUrl}
              />
            ))}
          </div>
        </section>
      )}

      {/* Grouped by category */}
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
              />
            ))}
          </div>
        </section>
      ))}

      {uncategorized.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Diğer</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {uncategorized.map((tag) => (
              <StyleTagCard
                key={tag.id}
                name={tag.name}
                slug={tag.slug}
                postCount={tag.postCount}
                coverUrl={tag.coverUrl}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
