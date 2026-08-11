// Public-safe DTO for GET /api/v1/businesses/:slug. packages/domain/src/businesses/queries.ts's
// getBusinessBySlug() returns the full raw Prisma Business row (owner ID,
// geocoding internals, editorial/ownership metadata, etc.) for the web
// app's own admin-adjacent business-profile page — that's fine for a
// server-rendered page, but the API route must never forward that object
// as-is to an unauthenticated public caller. apps/web/src/lib/api/dto.ts's
// toBusinessDetailDTO() maps down to exactly this shape before the route
// returns it.

export interface BusinessDetailCategoryDTO {
  id: string;
  name: string;
  slug: string;
}

export interface BusinessDetailServiceDTO {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string | null;
  priceType: string;
  salePrice: string | null;
  saleEndsAt: string | null;
  isActive: boolean;
}

export interface BusinessDetailProfessionalDTO {
  id: string;
  slug: string;
  displayName: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export interface BusinessDetailHourDTO {
  dayOfWeek: string;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
}

export interface BusinessDetailReviewDTO {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface BusinessDetailDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  categories: BusinessDetailCategoryDTO[];
  services: BusinessDetailServiceDTO[];
  professionals: BusinessDetailProfessionalDTO[];
  hours: BusinessDetailHourDTO[];
  reviews: BusinessDetailReviewDTO[];
  reviewCount: number;
  appointmentCount: number;
}
