import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getAllStyleTags } from "@/lib/queries/style-tags";
import { db } from "@/lib/db";
import { StyleTagCard } from "@/components/explore/style-tag-card";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Stil Rehberi",
  description: "Saç modelleri, dövme stilleri, tırnak tasarımları ve daha fazlası. UrGlowUp Stil Rehberi ile ilham alın ve randevu alın.",
  alternates: { canonical: "/styles" },
};

export default async function StylesPage() {
  const [tags, categories] = await Promise.all([
    getAllStyleTags(),
    db.businessCategory.findMany({ select: { id: true, name: true, slug: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  // Group tags by category
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
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Ana Sayfa</Link>
        <ChevronRight className="size-3" />
        <Link href="/explore?tab=ilham" className="hover:text-foreground">İlham</Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">Stil Rehberi</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stil Rehberi</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          İlham almak istediğin stili seç, sana göre işletmeleri keşfet.
        </p>
      </div>

      {/* Grouped by category */}
      {Array.from(grouped.entries()).map(([catId, group]) => (
        <section key={catId} className="space-y-3">
          <h2 className="text-base font-semibold">{group.categoryName}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.tags.map((tag) => (
              <StyleTagCard key={tag.id} name={tag.name} slug={tag.slug} postCount={tag.postCount} />
            ))}
          </div>
        </section>
      ))}

      {uncategorized.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Diğer</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {uncategorized.map((tag) => (
              <StyleTagCard key={tag.id} name={tag.name} slug={tag.slug} postCount={tag.postCount} />
            ))}
          </div>
        </section>
      )}

      {tags.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-16">Henüz stil etiketi yok.</p>
      )}
    </div>
  );
}
