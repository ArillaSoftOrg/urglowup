import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { env } from "@/lib/env";

export const metadata = { title: "Admin Girişi" };

export default async function AdminLoginPage() {
  const googleEnabled = Boolean(
    env.GOOGLE_AUTH_CLIENT_ID && env.GOOGLE_AUTH_CLIENT_SECRET,
  );

  return (
    <AuthCard
      title="Admin Girişi"
      description="Admin panelinize erişmek için giriş yapın."
      footerText="Şifreni mi unuttun?"
      footerHref="/admin/forgot-password"
      footerLabel="Sıfırla"
    >
      <LoginForm
        redirectTo="/admin"
        googleEnabled={googleEnabled}
      />
    </AuthCard>
  );
}
