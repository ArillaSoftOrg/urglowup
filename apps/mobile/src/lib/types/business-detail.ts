// Mirrors packages/domain/src/businesses/queries.ts's BusinessWithDetails as it
// crosses the wire from GET /api/v1/businesses/:slug (apps/web/src/app/api/v1/businesses/[slug]/route.ts
// returns the domain object directly via apiOk). Prisma Decimal fields
// (price/salePrice) serialize to strings over JSON — display with Number(),
// matching the same idiom apps/web's business-profile components use.

export interface BusinessDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  city: string | null;
  district: string | null;
  categories: { category: { id: string; name: string; slug: string } }[];
  services: BusinessDetailService[];
  professionals: BusinessDetailProfessional[];
  hours: BusinessDetailHour[];
  reviews: BusinessDetailReview[];
  _count: { reviews: number; appointments: number };
}

export interface BusinessDetailService {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string | null;
  priceType: "FIXED" | "STARTS_FROM" | "FREE_CONSULTATION" | "CONSULTATION_REQUIRED";
  salePrice: string | null;
  isActive: boolean;
}

export interface BusinessDetailProfessional {
  id: string;
  slug: string;
  displayName: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export interface BusinessDetailHour {
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
}

export interface BusinessDetailReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: { firstName: string | null; lastName: string | null };
}
