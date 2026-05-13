import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { db } from "@/lib/db";

export default async function BusinessOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // If user already owns a business, send them to the dashboard
  const existing = await db.business.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });
  if (existing) redirect("/business/dashboard");

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
    </>
  );
}
