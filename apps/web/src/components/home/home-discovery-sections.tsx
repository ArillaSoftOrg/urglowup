import { HomeBusinessRow } from "@/components/home/home-business-row";
import type { HomeDiscoveryCopy } from "@/lib/home-discovery-copy";
import type {
  HomePersonalization,
  MarketplaceBusiness,
} from "@/lib/queries/marketplace";
import {
  selectNewBusinesses,
  selectPopularBusinesses,
  selectRecommendedBusinesses,
} from "@/lib/marketplace/ranking";

interface HomeDiscoverySectionsProps {
  businesses: MarketplaceBusiness[];
  copy: HomeDiscoveryCopy;
  exploreHref: string;
  locale?: string;
  personalization?: HomePersonalization | null;
  recentBusinessIds?: string[];
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
    .filter(
      (business): business is MarketplaceBusiness =>
        Boolean(business) && business?.ownershipStatus === "CLAIMED",
    );
  const recentlyViewedBusinesses = recentBusinessIds
    .map((id) => byId.get(id))
    .filter(
      (business): business is MarketplaceBusiness =>
        Boolean(business) && business?.ownershipStatus === "CLAIMED",
    );

  const preferredCategoryIds = new Set(
    personalization?.preferredCategoryIds ?? [],
  );
  const recommendedBusinesses = selectRecommendedBusinesses(
    businesses,
    preferredCategoryIds,
  );
  const newBusinesses = selectNewBusinesses(businesses);
  const popularBusinesses = selectPopularBusinesses(businesses);

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
