import type { Metadata } from "next";
import { getExplorePosts } from "@/lib/queries/posts";
import { getCurrentUser } from "@/lib/auth";
import { DealGrid } from "@/components/marketplace/deal-card";
import { getDictionary } from "@/lib/get-dictionary";
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";
import type { Locale } from "@/lib/i18n-config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const alternates = buildAlternates("/deals", locale);

  return {
    title: dict.deals.title,
    description: dict.deals.description,
    openGraph: {
      title: dict.deals.title,
      description: dict.deals.description,
      url: `/${locale}/deals`,
      locale: getOgLocale(locale),
    },
    alternates,
  };
}

export default async function LocaleDealsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  const user = await getCurrentUser().catch(() => null);

  const { posts } = await getExplorePosts({
    take: 30,
    userId: user?.id,
    includePromotions: true,
    onlyPromotions: true,
  });

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10">
      <div className="mb-6 lg:mb-10">
        <h1 className="text-lg font-semibold tracking-[-0.02em] sm:text-xl md:text-2xl">
          {dict.deals.title}
        </h1>
        <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
          {dict.deals.description}
        </p>
      </div>

      <DealGrid posts={posts} locale={locale} />
    </div>
  );
}
