import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { PublicAccountMenu } from "./public-account-menu";
import { getPublicAccountMenuState } from "./public-account-menu-state";
import { NavLinks } from "./navbar-nav-links";
import { NavbarScrollEffect } from "./navbar-scroll-effect";
import { HomeSearchPanel } from "@/components/home/home-search-panel";
import { getMarketplaceCategories, getMarketplaceCities } from "@/lib/queries/marketplace";
import { getHomeSearchCopy } from "@/lib/home-search-copy";
import { getDictionary } from "@/lib/get-dictionary";
import type { Locale } from "@/lib/i18n-config";

interface NavbarProps {
  locale?: Locale;
  hideExploreLinks?: boolean;
}

export async function Navbar({ locale = "tr", hideExploreLinks = false }: NavbarProps) {
  const [user, dict, categories, cities] = await Promise.all([
    getCurrentUser(),
    getDictionary(locale),
    getMarketplaceCategories(),
    getMarketplaceCities(),
  ]);

  const p = (path: string) =>
    locale === "tr" ? path : `/${locale}${path}`;

  const menuState = await getPublicAccountMenuState(user, locale);
  const businessHref = p("/for-business");
  const activeCategories = categories.filter((c) => c.businessCount > 0);
  const searchCopy = getHomeSearchCopy(locale);

  return (
    <header
      data-navbar
      className="sticky top-0 z-50 w-full border-b border-transparent bg-background/95
        transition-[background-color,border-color,box-shadow] duration-200
        data-[scrolled=true]:border-border
        data-[scrolled=true]:bg-background/80
        data-[scrolled=true]:backdrop-blur-md
        data-[scrolled=true]:shadow-[var(--shadow-sm)]"
    >
      <NavbarScrollEffect />
      <div className="container mx-auto flex h-[4.5rem] items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href={p("/")}
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-pink/20">
            <Sparkles className="size-4 text-brand-pink-foreground" />
          </span>
          <span className="text-xl font-bold tracking-tight">UrGlowUp</span>
        </Link>

        {!hideExploreLinks && (
          <NavLinks
            links={[
              { label: dict.nav.explore, href: p("/explore") },
              { label: dict.nav.forBusiness, href: businessHref },
            ]}
          />
        )}

        <div className="hidden flex-1 justify-center lg:flex">
          <HomeSearchPanel
            variant="compact"
            categories={activeCategories.map((category) => ({
              name: category.name,
              slug: category.slug,
            }))}
            cities={cities}
            exploreHref={p("/explore")}
            locale={locale}
            labels={{
              searchPlaceholder: searchCopy.searchPlaceholder,
              regionPlaceholder: searchCopy.regionPlaceholder,
              categoryPlaceholder: searchCopy.categoryPlaceholder,
              datePlaceholder: searchCopy.datePlaceholder,
              submit: searchCopy.submit,
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <PublicAccountMenu
            state={menuState}
            labels={{
              openMenu: dict.nav.openMenu,
              account: dict.nav.account,
              businessPanel: dict.nav.businessPanel,
              adminPanel: dict.nav.adminPanel,
              forBusiness: dict.nav.forBusiness,
              listBusiness: dict.nav.listBusiness,
            }}
            hideExploreLinks={hideExploreLinks}
          />
        </div>
      </div>
    </header>
  );
}
