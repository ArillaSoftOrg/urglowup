import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BusinessSidebar } from "@/components/business/layout/business-sidebar";
import { BusinessTopbar } from "@/components/business/layout/business-topbar";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  robots: privateRobots,
};

export default async function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const member = await db.businessMember.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!member) redirect("/");

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <BusinessSidebar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
