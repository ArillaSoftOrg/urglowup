import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/lib/queries/business";
import { getBusinessReviewSummary } from "@/lib/queries/reviews";
import { CoverSection } from "@/components/business-profile/cover-section";
import { ProfileHeader } from "@/components/business-profile/profile-header";
import { QuickInfoBar } from "@/components/business-profile/quick-info-bar";
import { AboutSection } from "@/components/business-profile/about-section";
import { ServicesSection } from "@/components/business-profile/services-section";
import { MediaSection } from "@/components/business-profile/media-section";
import { ReviewsSection } from "@/components/business-profile/reviews-section";
import { LocationSection } from "@/components/business-profile/location-section";
import { HoursSection, isBusinessOpen } from "@/components/business-profile/hours-section";
import { ContactSidebar } from "@/components/business-profile/contact-sidebar";
import { MobileBookingBar } from "@/components/business-profile/mobile-booking-bar";
import type { Metadata } from "next";

const HIDDEN_STATUSES = new Set(["SUSPENDED", "REJECTED"]);

interface PageProps {
  params: Promise<{ slug: string }>;
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
    alternates: { canonical: `/b/${slug}` },
  };
}

export default async function BusinessProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business || HIDDEN_STATUSES.has(business.status)) {
    notFound();
  }

  const reviewSummary = await getBusinessReviewSummary(business.id);
  const isOpen = isBusinessOpen(business.hours);

  return (
    <>
      <CoverSection business={business} />

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main content */}
          <div className="min-w-0 flex-1 space-y-6">
            <ProfileHeader business={business} />
            <QuickInfoBar
              hours={business.hours}
              reviewSummary={reviewSummary}
              city={business.city}
              district={business.district}
              serviceCount={business.services.length}
            />
            <AboutSection business={business} />
            <ServicesSection business={business} />
            <HoursSection business={business} />
            <MediaSection business={business} />
            <ReviewsSection
              business={business}
              reviewSummary={reviewSummary}
            />
            <LocationSection business={business} />

            {/* Spacer for mobile sticky CTA */}
            <div className="h-20 lg:hidden" />
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden w-80 shrink-0 lg:block">
            <ContactSidebar business={business} reviewSummary={reviewSummary} />
          </aside>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <MobileBookingBar slug={business.slug} isOpen={isOpen} />
    </>
  );
}
