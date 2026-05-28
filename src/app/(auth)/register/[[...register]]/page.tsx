import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import {
  buildAuthRedirectQuery,
  normalizeAuthRedirect,
} from "@/lib/auth-redirect";
import { env } from "@/lib/env";

export const metadata = { title: "Hesap Oluştur" };

interface PageProps {
  searchParams: Promise<{ redirect_url?: string }>;
}

export default async function RegisterPage({ searchParams }: PageProps) {
  const { redirect_url } = await searchParams;
  const redirectTo = normalizeAuthRedirect(redirect_url);
  const googleEnabled = Boolean(
    env.GOOGLE_AUTH_CLIENT_ID && env.GOOGLE_AUTH_CLIENT_SECRET,
  );

  return (
    <AuthCard
      title="Hesap oluştur"
      description="UrGlowUp hesabınızla favori uzmanları kaydedin ve randevu sürecinizi yönetin."
      footerText="Zaten hesabın var mı?"
      footerHref={`/login${buildAuthRedirectQuery(redirectTo)}`}
      footerLabel="Giriş yap"
    >
      <RegisterForm redirectTo={redirectTo} googleEnabled={googleEnabled} />
    </AuthCard>
  );
}
