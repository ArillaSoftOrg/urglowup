import type { Metadata } from "next";
import Link from "next/link";
import {
  getMarketplaceBusinesses,
  getMarketplaceCities,
} from "@/lib/queries/marketplace";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import { ChevronRight, MapPin } from "lucide-react";
import { db } from "@/lib/db";

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  const cities = await getMarketplaceCities();
  return cities.map(({ city }) => ({ city: encodeURIComponent(city) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: rawCity } = await params;
  const city = decodeURIComponent(rawCity);
  return {
    title: `Beauty & Personal Care in ${city}`,
    description: `Find beauty and personal care professionals in ${city} on UrGlowUp.`,
  };
}

export default async function CityPage({ params }: PageProps) {
  const { city: rawCity } = await params;
  const city = decodeURIComponent(rawCity);

  const [businesses, districts] = await Promise.all([
    getMarketplaceBusinesses({ city }),
    // Fetch distinct districts for this city
    db.business.findMany({
      where: {
        status: "ACTIVE_MARKETPLACE",
        isMarketplaceVisible: true,
        city: { equals: city, mode: "insensitive" },
        district: { not: null },
      },
      select: { district: true },
      distinct: ["district"],
      orderBy: { district: "asc" },
    }),
  ]);

  const districtList = districts
    .map((d) => d.district)
    .filter((d): d is string => d !== null);

  return (
    <div className="container mx-auto space-y-8 px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/explore" className="hover:underline">
          Explore
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{city}</span>
      </nav>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-muted-foreground" />
          <h1 className="text-3xl font-bold tracking-tight">
            Professionals in {city}
          </h1>
        </div>
        {businesses.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {businesses.length} professional{businesses.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* District links */}
      {districtList.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Browse by district:</p>
          <div className="flex flex-wrap gap-2">
            {districtList.map((district) => (
              <Link
                key={district}
                href={`/city/${encodeURIComponent(city)}/${encodeURIComponent(district)}`}
                className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-sm transition-colors hover:bg-accent"
              >
                {district}
              </Link>
            ))}
          </div>
        </div>
      )}

      <BusinessGrid
        businesses={businesses}
        emptyMessage={`No professionals listed in ${city} yet.`}
      />
    </div>
  );
}
