import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
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
  await requireRole(UserRole.BUSINESS_OWNER);

  return (
    <div className="min-h-screen md:flex">
      <BusinessSidebar />
      <BusinessTopbar />
      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
