import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { privateRobots } from "@/lib/seo";
import { getSession } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  robots: privateRobots,
};

export default async function AdminMfaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.user;

  if (!user || user.role !== UserRole.ADMIN) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
