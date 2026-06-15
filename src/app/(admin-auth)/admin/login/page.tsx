import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { env } from "@/lib/env";

export const metadata = { title: "Admin Girisi" };

export default async function AdminLoginPage() {
  const googleEnabled = Boolean(
    env.GOOGLE_AUTH_CLIENT_ID && env.GOOGLE_AUTH_CLIENT_SECRET,
  );

  return (
    <AuthCard
      title="Admin Girisi"
      description="Admin panelinize erismek icin giris yapin."
      footerText="Sifreni mi unuttun?"
      footerHref="/admin/forgot-password"
      footerLabel="Sifirla"
    >
      <LoginForm redirectTo="/admin" googleEnabled={googleEnabled} />
    </AuthCard>
  );
}
