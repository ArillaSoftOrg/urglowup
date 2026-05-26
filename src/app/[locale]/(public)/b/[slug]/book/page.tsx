import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessForBooking } from "@/lib/queries/appointments";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { BookingUnavailable } from "@/components/booking/booking-unavailable";
import type { Metadata } from "next";

const HIDDEN_STATUSES = new Set(["SUSPENDED", "REJECTED"]);

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ service?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessForBooking(slug);

  if (!business || HIDDEN_STATUSES.has(business.status)) {
    return { title: "Business Not Found" };
  }

  return { title: `Appointment Request — ${business.name}` };
}

export default async function LocaleBookPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { service: serviceParam } = await searchParams;

  const [business, user] = await Promise.all([
    getBusinessForBooking(slug),
    getCurrentUser(),
  ]);

  if (!business || HIDDEN_STATUSES.has(business.status)) {
    notFound();
  }

  const hasServices = business.services.length > 0;
  const hasHours = business.hours.some((h) => h.isOpen);

  const initialServiceId =
    serviceParam && business.services.some((s) => s.id === serviceParam)
      ? serviceParam
      : undefined;

  if (!hasServices || !hasHours) {
    return (
      <BookingUnavailable
        business={{ name: business.name, slug: business.slug }}
        reason={!hasServices ? "no-services" : "no-hours"}
      />
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6 pb-10 sm:py-8">
      <BookingWizard
        business={business}
        isLoggedIn={!!user}
        initialServiceId={initialServiceId}
      />
    </div>
  );
}
