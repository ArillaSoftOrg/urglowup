import { HomeBusinessRow } from "@/components/home/home-business-row";
import type { HomeDiscoveryCopy } from "@/lib/home-discovery-copy";
import type {
  HomePersonalization,
  MarketplaceBusiness,
} from "@/lib/queries/marketplace";

interface HomeDiscoverySectionsProps {
  businesses: MarketplaceBusiness[];
  copy: HomeDiscoveryCopy;
  exploreHref: string;
  locale?: string;
  personalization?: HomePersonalization | null;
  recentBusinessIds?: string[];
}

function byRecommendationQuality(
  first: MarketplaceBusiness,
  second: MarketplaceBusiness,
) {
  const ratingDifference = (second.reviewAvg ?? 0) - (first.reviewAvg ?? 0);
  if (ratingDifference !== 0) return ratingDifference;
  return second.reviewCount - first.reviewCount;
}

export function HomeDiscoverySections({
  businesses,
  copy,
  exploreHref,
  locale,
  personalization,
  recentBusinessIds = [],
}: HomeDiscoverySectionsProps) {
  const byId = new Map(businesses.map((business) => [business.id, business]));
  const rebookBusinesses = (personalization?.rebookBusinessIds ?? [])
    .map((id) => byId.get(id))
    .filter((business): business is MarketplaceBusiness => Boolean(business));
  const recentlyViewedBusinesses = recentBusinessIds
    .map((id) => byId.get(id))
    .filter((business): business is MarketplaceBusiness => Boolean(business));

  const popularBusinesses = [...businesses]
    .sort(
      (first, second) =>
        second.reviewCount - first.reviewCount ||
        (second.reviewAvg ?? 0) - (first.reviewAvg ?? 0),
    )
    .slice(0, 12);

  const preferredCategoryIds = new Set(
    personalization?.preferredCategoryIds ?? [],
  );
  const recommendedBusinesses = [...businesses]
    .sort((first, second) => {
      const firstMatchesPreference = first.categories.some(({ category }) =>
        preferredCategoryIds.has(category.id),
      );
      const secondMatchesPreference = second.categories.some(({ category }) =>
        preferredCategoryIds.has(category.id),
      );

      if (firstMatchesPreference !== secondMatchesPreference) {
        return firstMatchesPreference ? -1 : 1;
      }

      return byRecommendationQuality(first, second);
    })
    .slice(0, 12);

  const newBusinesses = businesses.slice(0, 12);

  return (
    <div className="bg-background">
      <HomeBusinessRow
        id="rebook-businesses"
        title={copy.rebook}
        businesses={rebookBusinesses}
        locale={locale}
        surface="tinted"
      />
      <HomeBusinessRow
        id="recently-viewed-businesses"
        title={copy.recentlyViewed}
        businesses={recentlyViewedBusinesses}
        locale={locale}
      />
      <HomeBusinessRow
        id="recommended-businesses"
        title={copy.recommended}
        businesses={recommendedBusinesses}
        locale={locale}
        showAllHref={exploreHref}
        showAllLabel={copy.seeAll}
      />
      <HomeBusinessRow
        id="new-businesses"
        title={copy.newOnUrGlowUp}
        businesses={newBusinesses}
        locale={locale}
      />
      <HomeBusinessRow
        id="popular-businesses"
        title={copy.popular}
        businesses={popularBusinesses}
        locale={locale}
        showAllHref={exploreHref}
        showAllLabel={copy.seeAll}
      />
    </div>
  );
}
