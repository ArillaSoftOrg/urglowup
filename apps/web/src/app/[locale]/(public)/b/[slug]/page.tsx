import { notFound } from "next/navigation";
import {
  getBusinessBySlug,
  getBusinessMediaEngagement,
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
import { getDictionary } from "@/lib/get-dictionary";
import { getPublicAccountMenuState } from "@/components/layout/public-account-menu-state";
import { RecentBusinessViewTracker } from "@/components/home/recent-business-history";
import type { Locale } from "@/lib/i18n-config";
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

  const user = await getCurrentUser();
  const [dict, accountMenuState, isFavorited] = await Promise.all([
    getDictionary(locale as Locale),
    getPublicAccountMenuState(user, locale as Locale),
    user
      ? db.favorite.findUnique({
          where: { userId_businessId: { userId: user.id, businessId: business.id } },
          select: { id: true },
        })
      : null,
  ]);
  const accountMenuLabels = {
    openMenu: dict.nav.openMenu,
    account: dict.nav.account,
    businessPanel: dict.nav.businessPanel,
    adminPanel: dict.nav.adminPanel,
    forBusiness: dict.nav.forBusiness,
    listBusiness: dict.nav.listBusiness,
  };

  const portfolioMediaIds = business.media
    .filter((m) => m.type === "PORTFOLIO_IMAGE" || m.type === "PORTFOLIO_VIDEO")
    .map((m) => m.id);

  const [reviewSummary, googleReviewData, cityBusinessesRaw, fallbackBusinessesRaw, mediaEngagement] = await Promise.all([
    getBusinessReviewSummary(business.id),
    getGoogleReviewsForBusiness(business.id, {
      placeId: business.googlePlaceId,
      languageCode: locale,
      autoMatchBusiness: {
        id: business.id,
        slug: business.slug,
        name: business.name,
        address: business.address,
        city: business.city,
        district: business.district,
        latitude: business.latitude,
        longitude: business.longitude,
      },
    }),
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
  const location = [business.district, business.city].filter(Boolean).join(", ");

  return (
    <>
      <RecentBusinessViewTracker businessId={business.id} />
      <style>{`
        [data-navbar] {
          display: none !important;
        }
      `}</style>

      <main className="bg-background">
        <MobileBusinessProfile
          business={business}
          reviewSummary={reviewSummary}
          googleReviewData={googleReviewData}
          isOpen={isOpen}
          location={location}
          locale={locale}
          accountMenuState={accountMenuState}
          accountMenuLabels={accountMenuLabels}
          isLoggedIn={!!user}
          initialIsFavorited={!!isFavorited}
          mediaEngagement={mediaEngagement}
        />
        <DesktopBusinessProfile
          business={business}
          reviewSummary={reviewSummary}
          googleReviewData={googleReviewData}
          isOpen={isOpen}
          location={location}
          locale={locale}
          accountMenuState={accountMenuState}
          accountMenuLabels={accountMenuLabels}
          isLoggedIn={!!user}
          initialIsFavorited={!!isFavorited}
          mediaEngagement={mediaEngagement}
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
