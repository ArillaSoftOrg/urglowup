import { unstable_cache } from "next/cache";
import {
  getMarketplaceCategories as getMarketplaceCategoriesUncached,
  getMarketplaceCities as getMarketplaceCitiesUncached,
} from "@urglowup/domain/marketplace";

export * from "@urglowup/domain/marketplace";

/**
 * Cached for 60s: this is called on every page render via the persistent
 * header search (src/components/layout/navbar.tsx), in addition to the many
 * page-level callers — avoid re-querying the DB on every single request.
 * `unstable_cache` is Next.js App Router-specific, so it stays at this layer
 * rather than in packages/domain.
 */
export const getMarketplaceCategories = unstable_cache(
  getMarketplaceCategoriesUncached,
  ["marketplace-categories"],
  { revalidate: 60 },
);

/** Cached for 60s — same rationale as getMarketplaceCategories above. */
export const getMarketplaceCities = unstable_cache(
  getMarketplaceCitiesUncached,
  ["marketplace-cities"],
  { revalidate: 60 },
);
