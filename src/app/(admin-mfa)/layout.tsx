import type { Metadata } from "next";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  robots: privateRobots,
};

export default async function AdminMfaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
