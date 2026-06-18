import { notFound } from "next/navigation";
import { getBusinessBySlug, getGoogleReviewsForBusiness } from "@/lib/queries/business";
import { getBusinessReviewSummary } from "@/lib/queries/reviews";
import { ProfileHeader } from "@/components/business-profile/profile-header";
import { AboutSection } from "@/components/business-profile/about-section";
import { ServicesSection } from "@/components/business-profile/services-section";
import { ReviewsSection } from "@/components/business-profile/reviews-section";
import { LocationSection } from "@/components/business-profile/location-section";
import { HoursSection, isBusinessOpen } from "@/components/business-profile/hours-section";
import { ContactSidebar } from "@/components/business-profile/contact-sidebar";
import { BusinessGalleryHero } from "@/components/business-profile/business-gallery-hero";
import { MobileBusinessProfile } from "@/components/business-profile/mobile-business-profile";
import { buildAlternates, getOgLocale } from "@/lib/i18n-metadata";
import Link from "next/link";
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

  const alternates = buildAlternates(`/b/${slug}`, locale);

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
    alternates,
  };
}

export default async function LocaleBusinessProfilePage({ params }: PageProps) {
  const { locale, slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business || HIDDEN_STATUSES.has(business.status)) {
    notFound();
  }

  const [reviewSummary, googleReviews] = await Promise.all([
    getBusinessReviewSummary(business.id),
    getGoogleReviewsForBusiness(business.id),
  ]);
  const isOpen = isBusinessOpen(business.hours);
  const location = [business.district, business.city].filter(Boolean).join(", ");
  const primaryCategory = business.categories[0]?.category;

  return (
    <>
      <style>{`
        @media (max-width: 1023px) {
          [data-navbar],
          body > footer {
            display: none !important;
          }
        }
      `}</style>

      <main className="bg-background">
        <MobileBusinessProfile
          business={business}
          reviewSummary={reviewSummary}
          isOpen={isOpen}
          location={location}
          locale={locale}
        />

        <div className="container mx-auto hidden px-4 py-6 sm:py-8 lg:block">
          <nav className="mb-7 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/${locale}`} className="hover:text-foreground">
              Ana sayfa
            </Link>
            <span aria-hidden>·</span>
            {primaryCategory && (
              <>
                <Link
                  href={`/${locale}/category/${primaryCategory.slug}`}
                  className="hover:text-foreground"
                >
                  {primaryCategory.name}
                </Link>
                <span aria-hidden>·</span>
              </>
            )}
            {business.city && (
              <>
                <Link
                  href={`/${locale}/city/${encodeURIComponent(business.city)}`}
                  className="hover:text-foreground"
                >
                  {business.city}
                </Link>
                <span aria-hidden>·</span>
              </>
            )}
            <span className="font-medium text-foreground">{business.name}</span>
          </nav>

          <div className="space-y-7">
            <ProfileHeader
              business={business}
              reviewSummary={reviewSummary}
              isOpen={isOpen}
              location={location}
              locale={locale}
            />
            <BusinessGalleryHero business={business} />
          </div>
        </div>

        <div className="container mx-auto hidden px-4 pb-8 lg:block">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1 space-y-8">
              <ServicesSection business={business} />
              <AboutSection business={business} />
              <HoursSection business={business} />
              <ReviewsSection
                business={business}
                reviewSummary={reviewSummary}
                googleReviews={googleReviews}
              />
              <LocationSection business={business} />
              <div className="h-20 lg:hidden" />
            </div>

            <aside className="hidden w-80 shrink-0 lg:block">
              <ContactSidebar business={business} reviewSummary={reviewSummary} />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
