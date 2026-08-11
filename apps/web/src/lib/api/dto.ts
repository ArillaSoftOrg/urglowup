import type { getCurrentUser } from "@/lib/auth";
import type { BusinessWithDetails } from "@urglowup/domain/businesses";
import type { BusinessDetailDTO } from "@urglowup/validation";

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Never return the raw User row — strips internal/sensitive fields. */
export function toAccountDTO(user: CurrentUser) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/**
 * Never return the raw Business row from getBusinessBySlug — it carries
 * owner ID, geocoding internals, editorial ranking, and ownership/moderation
 * metadata never meant for a public, unauthenticated API consumer. Maps
 * down to exactly what the customer-facing business-detail screen needs.
 */
export function toBusinessDetailDTO(business: BusinessWithDetails): BusinessDetailDTO {
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    description: business.description,
    coverImageUrl: business.coverImageUrl,
    logoUrl: business.logoUrl,
    address: business.address,
    city: business.city,
    district: business.district,
    latitude: business.latitude,
    longitude: business.longitude,
    categories: business.categories.map(({ category }) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    services: business.services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      price: service.price?.toString() ?? null,
      priceType: service.priceType,
      salePrice: service.salePrice?.toString() ?? null,
      saleEndsAt: service.saleEndsAt?.toISOString() ?? null,
      isActive: service.isActive,
    })),
    professionals: business.professionals.map((professional) => ({
      id: professional.id,
      slug: professional.slug,
      displayName: professional.displayName,
      title: professional.title,
      bio: professional.bio,
      avatarUrl: professional.avatarUrl ?? professional.user?.avatarUrl ?? null,
    })),
    hours: business.hours.map((hour) => ({
      dayOfWeek: hour.dayOfWeek,
      isOpen: hour.isOpen,
      openTime: hour.openTime,
      closeTime: hour.closeTime,
    })),
    reviews: business.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      customer: {
        firstName: review.customer.firstName,
        lastName: review.customer.lastName,
        avatarUrl: review.customer.avatarUrl,
      },
    })),
    reviewCount: business._count.reviews,
    appointmentCount: business._count.appointments,
  };
}
