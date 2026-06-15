import Link from "next/link";
import { Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@/generated/prisma/enums";
import { NavbarMobileMenu } from "./navbar-mobile-menu";
import { NavLinks } from "./navbar-nav-links";
import { NavbarScrollEffect } from "./navbar-scroll-effect";
import { getDictionary } from "@/lib/get-dictionary";
import type { Locale } from "@/lib/i18n-config";

interface NavbarProps {
  locale?: Locale;
  hideExploreLinks?: boolean;
}

export async function Navbar({ locale = "tr", hideExploreLinks = false }: NavbarProps) {
  const [user, dict] = await Promise.all([
    getCurrentUser(),
    getDictionary(locale),
  ]);

  const membership =
    user && user.role !== UserRole.ADMIN
      ? await db.businessMember.findFirst({
          where: { userId: user.id },
          select: { id: true },
          orderBy: { createdAt: "asc" },
        })
      : null;

  const p = (path: string) =>
    locale === "tr" ? path : `/${locale}${path}`;

  const businessHref = p("/for-business");
  const accountHref = user
    ? user.role === UserRole.ADMIN
      ? { label: dict.nav.adminPanel, href: "/admin" }
      : membership
        ? { label: dict.nav.businessPanel, href: "/business/dashboard" }
        : { label: dict.nav.account, href: "/account" }
    : null;

  const menuPrimaryLink = accountHref ?? {
    label: dict.nav.forBusiness,
    href: businessHref,
  };

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

        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href={accountHref?.href ?? "/account"}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "hidden rounded-full border-border/80 bg-background px-5 font-semibold shadow-[0_1px_0_oklch(0.145_0_0/0.04)] md:inline-flex"
              )}
            >
              {accountHref?.label ?? dict.nav.account}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "hidden rounded-full px-4 font-semibold md:inline-flex"
                )}
              >
                {dict.nav.signIn}
              </Link>
              <Link
                href={businessHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "hidden rounded-full border-border/80 bg-background px-5 font-semibold shadow-[0_1px_0_oklch(0.145_0_0/0.04)] sm:inline-flex"
                )}
              >
                {dict.nav.listBusiness}
              </Link>
            </>
          )}
          <NavbarMobileMenu
            navLink={menuPrimaryLink}
            businessHref={businessHref}
            businessLabel={dict.nav.forBusiness}
            listBusinessLabel={dict.nav.listBusiness}
            exploreHref={p("/explore")}
            exploreLabel={dict.nav.explore}
            openMenuLabel={dict.nav.openMenu}
            signInLabel={dict.nav.signIn}
            signUpLabel={dict.nav.signUp}
            accountLabel={dict.nav.account}
            isLoggedIn={!!user}
            hideMarketingLinks={hideExploreLinks}
          />
        </div>
      </div>
    </header>
  );
}
