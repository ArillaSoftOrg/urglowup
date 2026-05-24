import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStyleTagBySlug, getStyleTagBusinesses, getStyleTagPosts, getAllStyleTags } from "@/lib/queries/style-tags";
import { db } from "@/lib/db";
import { StyleTagGuidePostGrid } from "@/components/explore/style-tag-guide-post-grid";
import { StyleTagCard } from "@/components/explore/style-tag-card";

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const tags = await db.styleTag.findMany({
    where: { isActive: true, posts: { some: { post: { status: "ACTIVE" } } } },
    select: { slug: true },
  });
  return tags.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getStyleTagBySlug(slug);
  if (!tag) return {};

  const title = `${tag.name} Nedir? ${tag.name} Stili Hakkında Rehber`;
  const description = tag.description
    ? `${tag.description} UrGlowUp'ta ${tag.name} yapan işletmeleri keşfedin ve randevu alın.`
    : `UrGlowUp'ta ${tag.name} yapan işletmeleri keşfedin, ilham alın ve hemen randevu alın.`;

  return {
    title,
    description,
    openGraph: { title, description, url: `/styles/${slug}` },
    alternates: { canonical: `/styles/${slug}` },
  };
}

export default async function StyleGuidePage({ params }: PageProps) {
  const { slug } = await params;

  const tag = await getStyleTagBySlug(slug);
  if (!tag) notFound();

  const [businesses, postsResult, relatedTags] = await Promise.all([
    getStyleTagBusinesses(tag.id),
    getStyleTagPosts(tag.id, { take: 12 }),
    tag.categoryId
      ? db.styleTag.findMany({
          where: {
            isActive: true,
            categoryId: tag.categoryId,
            id: { not: tag.id },
          },
          select: { id: true, name: true, slug: true, categoryId: true, _count: { select: { posts: { where: { post: { status: "ACTIVE" } } } } } },
          orderBy: { sortOrder: "asc" },
          take: 8,
        })
      : Promise.resolve([]),
  ]);

  const posts = postsResult.posts;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
        <Link href="/" className="hover:text-foreground">Ana Sayfa</Link>
        <ChevronRight className="size-3" />
        <Link href="/explore?tab=ilham" className="hover:text-foreground">İlham</Link>
        <ChevronRight className="size-3" />
        <Link href="/styles" className="hover:text-foreground">Stil Rehberi</Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">{tag.name}</span>
      </nav>

      {/* Section 1 — Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{tag.name}</h1>
          {tag.postCount > 0 && (
            <span className="mt-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {tag.postCount} gönderi
            </span>
          )}
        </div>
        {tag.category && (
          <Link
            href={`/category/${tag.category.slug}`}
            className="inline-block rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {tag.category.name}
          </Link>
        )}
        {tag.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{tag.description}</p>
        )}
      </div>

      {/* Section 2 — Bookable businesses */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Bu Stili Yapan İşletmeler</h2>
        {businesses.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {businesses.slice(0, 6).map((biz) => (
              <div key={biz.id} className="flex items-center gap-3 rounded-xl border p-3">
                <Avatar className="size-10 shrink-0">
                  {biz.logoUrl && <AvatarImage src={biz.logoUrl} alt={biz.name} />}
                  <AvatarFallback className="text-xs">{biz.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Link href={`/b/${biz.slug}`} className="block truncate text-sm font-medium hover:underline">
                    {biz.name}
                  </Link>
                  {biz.city && <p className="truncate text-xs text-muted-foreground">{biz.city}</p>}
                </div>
                <Link
                  href={`/b/${biz.slug}/book`}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <CalendarDays className="size-3" />
                  Randevu al
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Henüz bu stili yapan kayıtlı işletme yok.
          </p>
        )}
      </section>

      {/* Section 3 — Post gallery */}
      {posts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">İlhamı Gör</h2>
            <Link
              href="/explore?tab=ilham"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              İlham akışında daha fazla gör →
            </Link>
          </div>
          <StyleTagGuidePostGrid posts={posts} />
        </section>
      )}

      {/* Section 4 — Related styles */}
      {relatedTags.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold">İlgili Stiller</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {relatedTags.map((t) => (
              <StyleTagCard
                key={t.id}
                name={t.name}
                slug={t.slug}
                postCount={t._count.posts}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
