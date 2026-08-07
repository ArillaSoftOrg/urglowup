import { AuthCard } from "@/components/auth/auth-card";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import {
  buildAuthRedirectQuery,
  normalizeAuthRedirect,
} from "@/lib/auth-redirect";

export const metadata = { title: "E-posta Doğrulama" };

interface PageProps {
  searchParams: Promise<{ redirect_url?: string; email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { redirect_url, email } = await searchParams;
  const redirectTo = normalizeAuthRedirect(redirect_url);

  return (
    <AuthCard
      title="E-posta adresini doğrula"
      description="Doğrulama bağlantısını yeniden gönderebiliriz. Yalnızca doğrulanmamış bir hesaba aitse e-posta gönderilir."
      footerText="Giriş ekranına dön"
      footerHref={`/login${buildAuthRedirectQuery(redirectTo)}`}
      footerLabel="Giriş yap"
    >
      <VerifyEmailForm redirectTo={redirectTo} defaultEmail={email} />
    </AuthCard>
  );
}
