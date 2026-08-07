import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { AccountMobileNav } from "@/components/account/account-mobile-nav";
import { AccountTopNav } from "@/components/account/account-top-nav";
import { LocaleReconciler } from "@/components/layout/locale-reconciler";
import { db } from "@/lib/db";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  robots: privateRobots,
};

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const prefs = await db.userPreferences.findUnique({
    where: { userId: user.id },
    select: { locale: true },
  });

  return (
    <>
      <LocaleReconciler dbLocale={prefs?.locale ?? null} />
      <Navbar hideExploreLinks />
      <AccountTopNav />
      <main className="flex-1 bg-surface-cream">
        <div className="container mx-auto px-4 py-6 pb-24 md:py-8 md:pb-10">
          {children}
        </div>
      </main>
      <AccountMobileNav />
    </>
  );
}
