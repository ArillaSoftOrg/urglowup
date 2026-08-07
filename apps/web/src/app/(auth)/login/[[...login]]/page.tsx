import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import {
  buildAuthRedirectQuery,
  normalizeAuthRedirect,
} from "@/lib/auth-redirect";
import { env } from "@/lib/env";

export const metadata = { title: "Giriş Yap" };

interface PageProps {
  searchParams: Promise<{ redirect_url?: string; reset?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { redirect_url, reset } = await searchParams;
  const redirectTo = normalizeAuthRedirect(redirect_url);
  const isBusinessLogin = redirectTo.startsWith("/business");
  const googleEnabled = Boolean(
    env.GOOGLE_AUTH_CLIENT_ID && env.GOOGLE_AUTH_CLIENT_SECRET,
  );

  return (
    <AuthCard
      title={isBusinessLogin ? "İşletme girişi" : "Giriş yap"}
      description={
        isBusinessLogin
          ? "İşletme panelinize, randevularınıza ve profil yönetimine güvenle erişin."
          : "Randevularınızı, favorilerinizi ve mesajlarınızı güvenle yönetin."
      }
      footerText="Hesabın yok mu?"
      footerHref={`/register${buildAuthRedirectQuery(redirectTo)}`}
      footerLabel="Kayıt ol"
    >
      <LoginForm
        redirectTo={redirectTo}
        resetSuccess={reset === "success"}
        googleEnabled={googleEnabled}
      />
    </AuthCard>
  );
}
