import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import {
  buildAuthRedirectQuery,
  normalizeAuthRedirect,
} from "@/lib/auth-redirect";

export const metadata = { title: "Giriş Yap" };

interface PageProps {
  searchParams: Promise<{ redirect_url?: string; reset?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { redirect_url, reset } = await searchParams;
  const redirectTo = normalizeAuthRedirect(redirect_url);

  return (
    <AuthCard
      title="Giriş yap"
      description="Randevularınıza, favorilerinize ve işletme panelinize güvenle erişin."
      footerText="Hesabın yok mu?"
      footerHref={`/register${buildAuthRedirectQuery(redirectTo)}`}
      footerLabel="Kayıt ol"
    >
      <LoginForm redirectTo={redirectTo} resetSuccess={reset === "success"} />
    </AuthCard>
  );
}
