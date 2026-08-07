import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user && user.role === UserRole.ADMIN) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}
