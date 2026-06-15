import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthFormFeedback } from "@/components/auth/auth-form-feedback";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = { title: "Yeni Sifre Olustur - Admin" };

interface PageProps {
  searchParams: Promise<{ token?: string; error?: string; next?: string }>;
}

export default async function AdminResetPasswordPage({
  searchParams,
}: PageProps) {
  const { token, error, next } = await searchParams;
  const invalid = error === "INVALID_TOKEN" || !token;
  const redirectTo = next || "/admin";

  return (
    <AuthCard
      title="Yeni sifre olustur"
      description={
        invalid
          ? "Bu baglanti artik kullanilamiyor. Guvenliginiz icin yeni bir sifre sifirlama baglantisi istemeniz gerekiyor."
          : "Admin hesabiniz icin guclu bir yeni sifre belirleyin."
      }
      footerText="Giris ekranina don"
      footerHref="/admin/login"
      footerLabel="Giris yap"
    >
      {invalid ? (
        <div className="space-y-4">
          <AuthFormFeedback
            tone="error"
            message="Sifre sifirlama baglantisi gecersiz, suresi dolmus veya daha once kullanilmis gorunuyor. Devam etmek icin yeni bir baglanti isteyin."
          />
          <Link
            href="/admin/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Yeni baglanti iste
          </Link>
        </div>
      ) : (
        <ResetPasswordForm token={token} redirectTo={redirectTo} />
      )}
    </AuthCard>
  );
}
