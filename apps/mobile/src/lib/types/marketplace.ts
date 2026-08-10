// Local view-model types for /api/v1 marketplace responses. packages/api-client's
// resources return `unknown` where packages/domain doesn't export a standalone
// DTO type yet (see resources.ts's doc comment) — these mirror the actual JSON
// shape returned by MarketplaceBusiness/MarketplaceCategory (packages/domain/src/marketplace/queries.ts)
// closely enough for the mobile UI, without pulling server-only code into the app.

export interface Category {
  id: string;
  name: string;
  slug: string;
  businessCount: number;
}

export interface BusinessSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  city: string | null;
  district: string | null;
  categories: { category: { id: string; name: string; slug: string } }[];
  reviewCount: number;
  reviewAvg: number | null;
  startingPrice?: number | null;
}
