import { notFound } from "next/navigation";
import {
  getBusinessBySlug,
  getGoogleReviewsForBusiness,
} from "@/lib/queries/business";
import { getBusinessReviewSummary } from "@/lib/queries/reviews";
import { DesktopBusinessProfile } from "@/components/business-profile/desktop-business-profile";
import { isBusinessOpen } from "@/components/business-profile/hours-section";
import { MobileBusinessProfile } from "@/components/business-profile/mobile-business-profile";
import { ProfileEndingSection } from "@/components/business-profile/profile-ending-section";
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";
import { getMarketplaceBusinesses } from "@/lib/queries/marketplace";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import type { Metadata } from "next";

const HIDDEN_STATUSES = new Set(["SUSPENDED", "REJECTED"]);

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business || HIDDEN_STATUSES.has(business.status)) {
    return { title: "Business Not Found" };
  }

  const description =
    business.description ??
    `View ${business.name}'s profile, services, and reviews on UrGlowUp.`;

  return {
    title: business.name,
    description,
    openGraph: {
      title: business.name,
      description,
      url: `/${locale}/b/${slug}`,
      type: "website",
      locale: getOgLocale(locale),
      ...(business.coverImageUrl && {
        images: [{ url: business.coverImageUrl }],
      }),
    },
    alternates: buildAlternates(`/b/${slug}`, locale),
  };
}

export default async function LocaleBusinessProfilePage({ params }: PageProps) {
  const { locale, slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business || HIDDEN_STATUSES.has(business.status)) {
    notFound();
  }

  const p = (path: string) => (locale === "tr" ? path : `/${locale}${path}`);
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
        : p("/account")
    : p("/login");
  const isFavorited = user
    ? !!(await db.favorite.findUnique({
        where: { userId_businessId: { userId: user.id, businessId: business.id } },
        select: { id: true },
      }))
    : false;

  const [reviewSummary, googleReviews, cityBusinessesRaw, fallbackBusinessesRaw] = await Promise.all([
    getBusinessReviewSummary(business.id),
    getGoogleReviewsForBusiness(business.id),
    getMarketplaceBusinesses({
      city: business.city ?? undefined,
    }),
    getMarketplaceBusinesses(),
  ]);
  const nearbyBusinesses = [...cityBusinessesRaw, ...fallbackBusinessesRaw]
    .filter((item, index, items) =>
      item.id !== business.id &&
      items.findIndex((candidate) => candidate.id === item.id) === index
    )
    .slice(0, 4);
  const isOpen = isBusinessOpen(business.hours);
  const location = [business.district, business.city].filter(Boolean).join(", ");

  return (
    <>
      <style>{`
        [data-navbar] {
          display: none !important;
        }
      `}</style>

      <main className="bg-background">
        <MobileBusinessProfile
          business={business}
          reviewSummary={reviewSummary}
          isOpen={isOpen}
          location={location}
          locale={locale}
          isLoggedIn={!!user}
          initialIsFavorited={isFavorited}
        />
        <DesktopBusinessProfile
          business={business}
          reviewSummary={reviewSummary}
          googleReviews={googleReviews}
          isOpen={isOpen}
          location={location}
          locale={locale}
          accountHref={accountHref}
          isLoggedIn={!!user}
          initialIsFavorited={isFavorited}
        />
        <ProfileEndingSection
          business={business}
          nearbyBusinesses={nearbyBusinesses}
          locale={locale}
        />
      </main>
    </>
  );
}
