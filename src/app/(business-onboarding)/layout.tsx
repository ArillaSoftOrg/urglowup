import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { db } from "@/lib/db";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  robots: privateRobots,
};

export default async function BusinessOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // If user already has a business membership, send them to the dashboard
  const existing = await db.businessMember.findFirst({
    where: { userId: user.id },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing) redirect("/business/dashboard");

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
    </>
  );
}
