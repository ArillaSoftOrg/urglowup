import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import {
  buildAuthRedirectQuery,
  normalizeAuthRedirect,
} from "@/lib/auth-redirect";

export const metadata = { title: "Şifremi Unuttum" };

interface PageProps {
  searchParams: Promise<{ redirect_url?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const { redirect_url } = await searchParams;
  const redirectTo = normalizeAuthRedirect(redirect_url);

  return (
    <AuthCard
      title="Şifreni sıfırla"
      description="E-posta adresini gir. Şifre sıfırlama talebini güvenli şekilde işleyelim."
      footerText="Şifreni hatırladın mı?"
      footerHref={`/login${buildAuthRedirectQuery(redirectTo)}`}
      footerLabel="Giriş yap"
    >
      <ForgotPasswordForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
