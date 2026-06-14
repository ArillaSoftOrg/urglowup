import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Şifremi Unuttum - Admin" };

export default async function AdminForgotPasswordPage() {
  return (
    <AuthCard
      title="Şifreni sıfırla"
      description="E-posta adresini gir. Şifre sıfırlama talebini güvenli şekilde işleyelim."
      footerText="Şifreni hatırladın mı?"
      footerHref="/admin/login"
      footerLabel="Giriş yap"
    >
      <ForgotPasswordForm redirectTo="/admin" />
    </AuthCard>
  );
}
