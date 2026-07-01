import { notFound } from "next/navigation";
import { after } from "next/server";
import {
  getBusinessBySlug,
  getBusinessMediaEngagement,
  getGoogleReviewsForBusiness,
} from "@/lib/queries/business";
import { getBusinessReviewSummary } from "@/lib/queries/reviews";
import { buildAlternates } from "@/lib/i18n-metadata";
import { absoluteUrl } from "@/lib/seo";
import { DesktopBusinessProfile } from "@/components/business-profile/desktop-business-profile";
import { isBusinessOpen } from "@/components/business-profile/hours-section";
import { MobileBusinessProfile } from "@/components/business-profile/mobile-business-profile";
import { ProfileEndingSection } from "@/components/business-profile/profile-ending-section";
import { getMarketplaceBusinesses } from "@/lib/queries/marketplace";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import type { Metadata } from "next";

const HIDDEN_STATUSES = new Set(["SUSPENDED", "REJECTED"]);
const schemaDayOfWeek: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const VALID_SOURCES = new Set(["instagram", "facebook", "tiktok", "whatsapp"]);

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business || HIDDEN_STATUSES.has(business.status)) {
    return { title: "İşletme Bulunamadı" };
  }

  const description =
    business.description ??
    `${business.name} profilini, hizmetlerini ve değerlendirmelerini UrGlowUp'ta inceleyin.`;

  return {
    title: business.name,
    description,
    openGraph: {
      title: business.name,
      description,
      url: `/b/${slug}`,
      type: "website",
      ...(business.coverImageUrl && {
        images: [{ url: business.coverImageUrl }],
      }),
    },
    alternates: buildAlternates(`/b/${slug}`, "tr"),
  };
}

export default async function BusinessProfilePage({ params, searchParams }: PageProps) {
  const [{ slug }, { ref }] = await Promise.all([params, searchParams]);
  const business = await getBusinessBySlug(slug);

  if (!business || HIDDEN_STATUSES.has(business.status)) {
    notFound();
  }

  const source = ref && VALID_SOURCES.has(ref) ? ref : null;
  after(() =>
    db.businessPageView.create({
      data: { businessId: business.id, source },
    })
  );

  const user = await getCurrentUser();
  const membership =
    user && user.role !== UserRole.ADMIN
      ? await db.businessMember.findFirst({
          where: { userId: user.id },
          select: { id: true },
          orderBy: { createdAt: "asc" },
        })
      : null;
  const accountHref = user
    ? user.role === UserRole.ADMIN
      ? "/admin"
      : membership
        ? "/business/dashboard"
        : "/account"
    : "/login";
  const isFavorited = user
    ? !!(await db.favorite.findUnique({
        where: { userId_businessId: { userId: user.id, businessId: business.id } },
        select: { id: true },
      }))
    : false;

  const portfolioMediaIds = business.media
    .filter((m) => m.type === "PORTFOLIO_IMAGE" || m.type === "PORTFOLIO_VIDEO")
    .map((m) => m.id);

  const [reviewSummary, googleReviews, cityBusinessesRaw, fallbackBusinessesRaw, mediaEngagement] = await Promise.all([
    getBusinessReviewSummary(business.id),
    getGoogleReviewsForBusiness(business.id),
    getMarketplaceBusinesses({
      city: business.city ?? undefined,
    }),
    getMarketplaceBusinesses(),
    getBusinessMediaEngagement(portfolioMediaIds, user?.id),
  ]);
  const nearbyBusinesses = [...cityBusinessesRaw, ...fallbackBusinessesRaw]
    .filter((item, index, items) =>
      item.id !== business.id &&
      items.findIndex((candidate) => candidate.id === item.id) === index
    )
    .slice(0, 4);
  const isOpen = isBusinessOpen(business.hours);
  const businessUrl = absoluteUrl(`/b/${business.slug}`);
  const addressText = [business.address, business.district, business.city]
    .filter(Boolean)
    .join(", ");
  const location = [business.district, business.city].filter(Boolean).join(", ");
  const pricedServices = business.services
    .map((service) => Number(service.price))
    .filter((price) => Number.isFinite(price) && price > 0);
  const minPrice = pricedServices.length ? Math.min(...pricedServices) : null;
  const maxPrice = pricedServices.length ? Math.max(...pricedServices) : null;
  const priceRange =
    minPrice === null
      ? undefined
      : minPrice === maxPrice
        ? `₺${minPrice}`
        : `₺${minPrice}-₺${maxPrice}`;

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description:
      business.description ??
      `${business.name} profilini, hizmetlerini ve değerlendirmelerini UrGlowUp'ta inceleyin.`,
    url: businessUrl,
    image: business.coverImageUrl ?? business.logoUrl ?? undefined,
    logo: business.logoUrl ?? undefined,
    telephone: business.phone ?? undefined,
    priceRange,
    address: addressText
      ? {
          "@type": "PostalAddress",
          streetAddress: business.address ?? undefined,
          addressLocality: business.district ?? business.city ?? undefined,
          addressRegion: business.city ?? undefined,
          addressCountry: "TR",
        }
      : undefined,
    areaServed: business.city
      ? {
          "@type": "City",
          name: business.city,
        }
      : undefined,
    sameAs: business.instagramUrl ? [business.instagramUrl] : undefined,
    openingHoursSpecification: business.hours
      .filter((hour) => hour.isOpen && hour.openTime && hour.closeTime)
      .map((hour) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: schemaDayOfWeek[hour.dayOfWeek],
        opens: hour.openTime,
        closes: hour.closeTime,
      })),
    aggregateRating:
      reviewSummary.averageRating != null && reviewSummary.totalCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(reviewSummary.averageRating.toFixed(1)),
            reviewCount: reviewSummary.totalCount,
            bestRating: 10,
            worstRating: 0,
          }
        : undefined,
    hasOfferCatalog:
      business.services.length > 0
        ? {
            "@type": "OfferCatalog",
            name: `${business.name} hizmetleri`,
            itemListElement: business.services.map((service) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: service.name,
                description: service.description ?? undefined,
              },
              price:
                service.price != null && Number.isFinite(Number(service.price))
                  ? Number(service.price)
                  : undefined,
              priceCurrency: service.price ? "TRY" : undefined,
              url: absoluteUrl(`/b/${business.slug}/book?service=${service.id}`),
            })),
          }
        : undefined,
  };

  return (
    <>
      <style>{`
        [data-navbar] {
          display: none !important;
        }
      `}</style>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd),
        }}
      />

      <main className="bg-background">
        <MobileBusinessProfile
          business={business}
          reviewSummary={reviewSummary}
          isOpen={isOpen}
          location={location}
          isLoggedIn={!!user}
          initialIsFavorited={isFavorited}
          mediaEngagement={mediaEngagement}
        />
        <DesktopBusinessProfile
          business={business}
          reviewSummary={reviewSummary}
          googleReviews={googleReviews}
          isOpen={isOpen}
          location={location}
          accountHref={accountHref}
          isLoggedIn={!!user}
          initialIsFavorited={isFavorited}
          mediaEngagement={mediaEngagement}
        />
        <ProfileEndingSection
          business={business}
          nearbyBusinesses={nearbyBusinesses}
        />
      </main>
    </>
  );
}
