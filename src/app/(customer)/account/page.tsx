import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  getCustomerAppointments,
} from "@/lib/queries/appointments";
import { getCustomerFavorites } from "@/lib/queries/favorites";
import {
  getHomePersonalization,
  getMarketplaceBusinesses,
  getMarketplaceCategories,
  getMarketplaceCities,
} from "@/lib/queries/marketplace";
import { selectRecommendedBusinesses } from "@/lib/marketplace/ranking";
import { getHomeDiscoveryCopy } from "@/lib/home-discovery-copy";
import { getHomeSearchCopy } from "@/lib/home-search-copy";
import {
  RECENT_BUSINESSES_COOKIE_KEY,
  parseRecentBusinessIds,
} from "@/lib/recent-business-history";
import { HomeSearchPanel } from "@/components/home/home-search-panel";
import { HomeBusinessRow } from "@/components/home/home-business-row";
import { BusinessGrid } from "@/components/marketplace/business-grid";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { CalendarDays, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export const metadata = { title: "Hesabım" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [appointments, favorites, categories, businesses, cities, personalization, cookieStore] =
    await Promise.all([
      getCustomerAppointments(user.id),
      getCustomerFavorites(user.id),
      getMarketplaceCategories(),
      getMarketplaceBusinesses({ limit: 250 }),
      getMarketplaceCities(),
      getHomePersonalization(user.id),
      cookies(),
    ]);

  const now = new Date();
  const upcomingAppointment = appointments.find(
    (a) =>
      (a.status === "PENDING" || a.status === "CONFIRMED") &&
      new Date(a.requestedDate) >= now
  );

  const activeCategories = categories.filter((c) => c.businessCount > 0);
  const discoveryCopy = getHomeDiscoveryCopy("tr");
  const searchCopy = getHomeSearchCopy("tr");

  const byId = new Map(businesses.map((business) => [business.id, business]));
  const recentBusinessIds = parseRecentBusinessIds(
    cookieStore.get(RECENT_BUSINESSES_COOKIE_KEY)?.value,
  );
  const rebookBusinesses = personalization.rebookBusinessIds
    .map((id) => byId.get(id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
  const recentlyViewedBusinesses = recentBusinessIds
    .map((id) => byId.get(id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
  const rebookRowBusinesses =
    rebookBusinesses.length > 0 ? rebookBusinesses : recentlyViewedBusinesses;
  const rebookRowTitle =
    rebookBusinesses.length > 0 ? discoveryCopy.rebook : discoveryCopy.recentlyViewed;

  const preferredCategoryIds = new Set(personalization.preferredCategoryIds);
  const recommendedBusinesses = selectRecommendedBusinesses(
    businesses,
    preferredCategoryIds,
  );

  const firstName = user.firstName || user.email.split("@")[0];

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <h1 className="text-2xl font-bold tracking-tight">
          Merhaba, {firstName}
        </h1>

        <HomeSearchPanel
          categories={activeCategories.map((category) => ({
            name: category.name,
            slug: category.slug,
          }))}
          cities={cities}
          exploreHref="/explore"
          labels={{
            searchPlaceholder: searchCopy.searchPlaceholder,
            regionPlaceholder: searchCopy.regionPlaceholder,
            categoryPlaceholder: searchCopy.categoryPlaceholder,
            datePlaceholder: searchCopy.datePlaceholder,
            submit: searchCopy.submit,
          }}
        />

        {upcomingAppointment ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Yaklaşan Randevu
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="font-semibold truncate">
                  {upcomingAppointment.business.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {upcomingAppointment.service.name}
                </p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-3.5 shrink-0" />
                  {format(
                    new Date(upcomingAppointment.requestedDate),
                    "d MMMM yyyy",
                    { locale: tr }
                  )}
                </div>
              </div>
              <Link
                href="/account/appointments"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Randevuyu yönet
              </Link>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            icon={CalendarDays}
            headline="Yaklaşan randevu yok"
            description="Yakınınızdaki güzellik ve bakım işletmelerini keşfedin."
            action={{ label: "İşletmeleri keşfet", href: "/explore" }}
            surface="cream"
            compact
          />
        )}
      </div>

      {rebookRowBusinesses.length > 0 && (
        <HomeBusinessRow
          id="account-rebook-businesses"
          title={rebookRowTitle}
          businesses={rebookRowBusinesses}
        />
      )}

      {favorites.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-[-0.01em]">
              Favorilerim
            </h2>
            <Link
              href="/account/favorites"
              className="shrink-0 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Tümünü gör →
            </Link>
          </div>
          <BusinessGrid businesses={favorites.slice(0, 4)} />
        </section>
      )}

      {recommendedBusinesses.length > 0 && (
        <HomeBusinessRow
          id="account-recommended-businesses"
          title={discoveryCopy.recommended}
          businesses={recommendedBusinesses}
          showAllHref="/explore"
          showAllLabel={discoveryCopy.seeAll}
        />
      )}
    </div>
  );
}
