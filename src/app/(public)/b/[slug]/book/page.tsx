import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarOff, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessForBooking } from "@/lib/queries/appointments";
import { BookingWizard } from "@/components/booking/booking-wizard";
import type { Metadata } from "next";

const HIDDEN_STATUSES = new Set(["SUSPENDED", "REJECTED"]);

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessForBooking(slug);

  if (!business || HIDDEN_STATUSES.has(business.status)) {
    return { title: "Business Not Found" };
  }

  return { title: `Book with ${business.name}` };
}

export default async function BookPage({ params, searchParams }: PageProps) {
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

  // Validate pre-selected service exists in the business's active services
  const initialServiceId =
    serviceParam && business.services.some((s) => s.id === serviceParam)
      ? serviceParam
      : undefined;

  if (!hasServices || !hasHours) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              {!hasServices ? (
                <CalendarOff className="size-7 text-muted-foreground" />
              ) : (
                <Clock className="size-7 text-muted-foreground" />
              )}
            </div>
            <CardTitle className="text-xl">Booking not available</CardTitle>
            <CardDescription className="max-w-xs">
              {!hasServices
                ? `${business.name} hasn't added any services yet. Check back soon!`
                : `${business.name} hasn't set up their schedule yet. Check back soon!`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href={`/b/${business.slug}`}>
              <Button variant="outline">
                <ArrowLeft className="size-4" />
                Back to profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/b/${business.slug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {business.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Request an Appointment</h1>
      </div>

      <BookingWizard
        business={business}
        isLoggedIn={!!user}
        initialServiceId={initialServiceId}
      />
    </div>
  );
}
