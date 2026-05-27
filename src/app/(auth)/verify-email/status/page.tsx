import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { getSession } from "@/lib/auth";
import {
  buildAuthRedirectQuery,
  normalizeAuthRedirect,
} from "@/lib/auth-redirect";

export const metadata = { title: "E-posta Doğrulama" };

interface PageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

const verificationErrors: Record<string, string> = {
  INVALID_TOKEN:
    "Doğrulama bağlantısı geçersiz, değiştirilmiş veya daha önce kullanılmış görünüyor.",
  TOKEN_EXPIRED:
    "Doğrulama bağlantısının süresi dolmuş. Güvenliğiniz için yeni bir bağlantı istemeniz gerekiyor.",
  USER_NOT_FOUND:
    "Bu doğrulama bağlantısı artık kullanılabilir bir hesaba bağlı değil.",
  INVALID_USER:
    "Bu doğrulama bağlantısı mevcut oturumla eşleşmiyor. Yeni bir bağlantı isteyin.",
};

export default async function VerifyEmailStatusPage({
  searchParams,
}: PageProps) {
  const { error, next } = await searchParams;
  const redirectTo = normalizeAuthRedirect(next);

  if (!error) {
    const session = await getSession();

    if (session?.user) {
      redirect(redirectTo);
    }

    return (
      <AuthCard
        title="E-posta doğrulandı"
        description="Doğrulama tamamlandı. Hesabınıza devam etmek için giriş yapabilirsiniz."
        footerText="Giriş ekranına dön"
        footerHref={`/login${buildAuthRedirectQuery(redirectTo)}`}
        footerLabel="Giriş yap"
      >
        <AuthFormFeedback
          tone="success"
          message="E-posta adresiniz doğrulandı. Yeni oturum açmak için giriş ekranına geçebilirsiniz."
        />
      </AuthCard>
    );
  }

  const retryHref = `/verify-email${buildAuthRedirectQuery(redirectTo)}`;

  return (
    <AuthCard
      title="Doğrulama bağlantısı geçersiz"
      description="Bu bağlantı artık kullanılamıyor. Güvenliğiniz için yeni bir doğrulama e-postası isteyin."
      footerText="Giriş ekranına dön"
      footerHref={`/login${buildAuthRedirectQuery(redirectTo)}`}
      footerLabel="Giriş yap"
    >
      <div className="space-y-4">
        <AuthFormFeedback
          tone="error"
          message={
            verificationErrors[error] ??
            "Doğrulama bağlantısı doğrulanamadı. Yeni bir bağlantı istemeniz gerekiyor."
          }
        />
        <Link
          href={retryHref}
          className="inline-flex w-full items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Yeni doğrulama bağlantısı iste
        </Link>
      </div>
    </AuthCard>
  );
}
