import type { Metadata } from "next";
import { getExplorePosts } from "@/lib/queries/posts";
import { getCurrentUser } from "@/lib/auth";
import { DealGrid } from "@/components/marketplace/deal-card";
import { buildAlternates } from "@/lib/i18n-metadata";

const description = "İşletmelerden güncel kampanyalar ve fırsatları keşfedin.";

export const metadata: Metadata = {
  title: "Fırsatlar",
  description,
  openGraph: {
    title: "Fırsatlar | UrGlowUp",
    description,
    url: "/deals",
    locale: "tr_TR",
  },
  alternates: buildAlternates("/deals", "tr"),
};

export default async function DealsPage() {
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
          Fırsatlar
        </h1>
        <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
          {description}
        </p>
      </div>

      <DealGrid posts={posts} />
    </div>
  );
}
