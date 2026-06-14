import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = { title: "Yeni Şifre Oluştur - Admin" };

interface PageProps {
  searchParams: Promise<{ token?: string; error?: string; next?: string }>;
}

export default async function AdminResetPasswordPage({ searchParams }: PageProps) {
  const { token, error, next } = await searchParams;
  const invalid = error === "INVALID_TOKEN" || !token;
  const redirectTo = next || "/admin";

  return (
    <AuthCard
      title="Yeni şifre oluştur"
      description={
        invalid
          ? "Bu bağlantı artık kullanılamıyor. Güvenliğiniz için yeni bir şifre sıfırlama bağlantısı istemeniz gerekiyor."
          : "Admin hesabınız için güçlü bir yeni şifre belirleyin."
      }
      footerText="Giriş ekranına dön"
      footerHref="/admin/login"
      footerLabel="Giriş yap"
    >
      {invalid ? (
        <div className="space-y-4">
          <AuthFormFeedback
            tone="error"
            message="Şifre sıfırlama bağlantısı geçersiz, süresi dolmuş veya daha önce kullanılmış görünüyor. Devam etmek için yeni bir bağlantı isteyin."
          />
          <Link
            href="/admin/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Yeni bağlantı iste
          </Link>
        </div>
      ) : (
        <ResetPasswordForm token={token} redirectTo={redirectTo} />
      )}
    </AuthCard>
  );
}
