import { requireRole } from "@/lib/auth";
import { UserRole } from "@/generated/prisma/enums";
import { redirect } from "next/navigation";
import { MfaSetupFlow } from "@/components/admin/mfa-setup-flow";

export const metadata = { title: "Admin - MFA Setup" };

export default async function MfaSetupPage() {
  const user = await requireRole(UserRole.ADMIN);

  if (user?.twoFactorEnabled) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <MfaSetupFlow />
    </div>
  );
}
