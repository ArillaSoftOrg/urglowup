import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Sifremi Unuttum - Admin" };

export default async function AdminForgotPasswordPage() {
  return (
    <AuthCard
      title="Sifreni sifirla"
      description="E-posta adresini gir. Sifre sifirlama talebini guvenli sekilde isleyelim."
      footerText="Sifreni hatirladin mi?"
      footerHref="/admin/login"
      footerLabel="Giris yap"
    >
      <ForgotPasswordForm redirectTo="/admin" />
    </AuthCard>
  );
}
