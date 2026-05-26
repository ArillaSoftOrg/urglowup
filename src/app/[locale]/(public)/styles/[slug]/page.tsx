import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CalendarDays } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  getStyleTagBySlug,
  getStyleTagBusinesses,
  getStyleTagPosts,
} from "@/lib/queries/style-tags";
import { db } from "@/lib/db";
import { StyleTagGuidePostGrid } from "@/components/explore/style-tag-guide-post-grid";
import { StyleTagCard } from "@/components/explore/style-tag-card";
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";
import { INTL_LOCALES } from "@/lib/i18n-config";
import { getAppUrl } from "@/lib/get-app-url";

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const tags = await db.styleTag.findMany({
    where: { isActive: true, posts: { some: { post: { status: "ACTIVE" } } } },
    select: { slug: true },
  });
  return [...INTL_LOCALES].flatMap((locale) =>
    tags.map((t) => ({ locale, slug: t.slug }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const tag = await getStyleTagBySlug(slug);
  if (!tag) return {};

  const title = `What is ${tag.name}? Guide to the ${tag.name} Style`;
  const categoryName = tag.category?.name ?? "beauty";
  const description = tag.description
    ? `${tag.description} Find ${tag.name} businesses on UrGlowUp and book an appointment.`
    : `What is ${tag.name}? Who is it for, and what care does it require? Find ${tag.name} ${categoryName} professionals on UrGlowUp and book an appointment.`;

  const alternates = buildAlternates(`/styles/${slug}`, locale);

  return {
    title,
    description,
    robots: tag.postCount === 0 ? { index: false } : undefined,
    openGraph: {
      title,
      description,
      url: `/${locale}/styles/${slug}`,
      locale: getOgLocale(locale),
      ...(tag.coverUrl && { images: [{ url: tag.coverUrl }] }),
    },
    alternates,
  };
}

export default async function LocaleStyleGuidePage({ params }: PageProps) {
  const { locale, slug } = await params;
  const p = (path: string) => `/${locale}${path}`;

  const tag = await getStyleTagBySlug(slug);
  if (!tag) notFound();

  const categoryName = tag.category?.name ?? "beauty";
  const jsonLdDescription = tag.description
    ?? `What is ${tag.name}? Who is it for, and what care does it require? Find ${tag.name} ${categoryName} professionals on UrGlowUp.`;

  const shortIntro = tag.description?.match(/^[^.!?]*[.!?]/)?.[0]?.trim() ?? null;

  const [businesses, postsResult, relatedTags] = await Promise.all([
    getStyleTagBusinesses(tag.id),
    getStyleTagPosts(tag.id, { take: 9 }),
    tag.categoryId
      ? db.styleTag.findMany({
          where: {
            isActive: true,
            categoryId: tag.categoryId,
            id: { not: tag.id },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            categoryId: true,
            _count: { select: { posts: { where: { post: { status: "ACTIVE" } } } } },
            posts: {
              take: 1,
              orderBy: { assignedAt: "desc" },
              where: { post: { status: "ACTIVE" } },
              select: {
                post: {
                  select: {
                    media: {
                      take: 1,
                      orderBy: { sortOrder: "asc" },
                      select: { url: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
          take: 8,
        })
      : Promise.resolve([]),
  ]);

  const posts = postsResult.posts;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            name: tag.name,
            description: jsonLdDescription,
            url: getAppUrl(`/${locale}/styles/${slug}`),
            publisher: {
              "@type": "Organization",
              name: "UrGlowUp",
              url: getAppUrl(),
            },
            ...(tag.coverUrl && {
              image: { "@type": "ImageObject", url: tag.coverUrl },
            }),
          }),
        }}
      />

      <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link href={p("/")} className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3" />
        <Link href={p("/explore?tab=ilham")} className="hover:text-foreground">
          Inspiration
        </Link>
        <ChevronRight className="size-3" />
        <Link href={p("/styles")} className="hover:text-foreground">
          Style Guide
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">{tag.name}</span>
      </nav>

      {/* Section 1 — Hero */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">{tag.name}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {tag.category && (
            <Link
              href={p(`/category/${tag.category.slug}`)}
              className="rounded-full bg-muted px-3 py-0.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              {tag.category.name}
            </Link>
          )}
          {tag.postCount > 0 && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {tag.postCount} posts
            </span>
          )}
        </div>
        {shortIntro && (
          <p className="text-base leading-relaxed">{shortIntro}</p>
        )}
        {(posts.length > 0 || businesses.length > 0) && (
          <div className="flex flex-wrap gap-3 pt-1">
            {posts.length > 0 && (
              <a href="#examples" className="text-sm font-medium text-primary hover:underline">
                See examples →
              </a>
            )}
            {businesses.length > 0 && (
              <a
                href="#businesses"
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Book this style
              </a>
            )}
          </div>
        )}
      </div>

      {/* Section 2 — Visual examples */}
      {posts.length > 0 && (
        <section id="examples" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Real Examples</h2>
            {postsResult.nextCursor && (
              <Link
                href={p(`/explore?tab=ilham&styleTagId=${tag.id}`)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                See more →
              </Link>
            )}
          </div>
          <StyleTagGuidePostGrid posts={posts} />
        </section>
      )}

      {/* Section 3 — Related styles */}
      {relatedTags.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Related Styles</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {relatedTags.map((t) => (
              <StyleTagCard
                key={t.id}
                name={t.name}
                slug={t.slug}
                postCount={t._count.posts}
                coverUrl={t.posts[0]?.post.media[0]?.url ?? null}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 4 — Businesses */}
      <section id="businesses" className="space-y-4">
        <h2 className="text-base font-semibold">Businesses Offering This Style</h2>
        {businesses.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {businesses.map((biz) => (
              <div key={biz.id} className="flex items-center gap-3 rounded-xl border p-3">
                <Avatar className="size-10 shrink-0">
                  {biz.logoUrl && <AvatarImage src={biz.logoUrl} alt={biz.name} />}
                  <AvatarFallback className="text-xs">
                    {biz.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Link
                    href={p(`/b/${biz.slug}`)}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {biz.name}
                  </Link>
                  {biz.city && (
                    <p className="truncate text-xs text-muted-foreground">{biz.city}</p>
                  )}
                </div>
                <Link
                  href={p(`/b/${biz.slug}/book`)}
                  className="shrink-0 flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <CalendarDays className="size-3" />
                  Book
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              No businesses listed for this style yet.
            </p>
            <Link
              href={p(`/explore?tab=ilham&styleTagId=${tag.id}`)}
              className="text-xs text-primary hover:underline"
            >
              Explore the inspiration feed →
            </Link>
          </div>
        )}
      </section>

      {/* Section 5 — SEO guide */}
      {tag.description && (
        <section className="space-y-3 border-t pt-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            What you should know about this style
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{tag.description}</p>
        </section>
      )}
    </div>
  );
}
