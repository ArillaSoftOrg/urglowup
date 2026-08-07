import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Admin Girisi" };

export default async function AdminLoginPage() {
  // Google OAuth is intentionally disabled for admin sign-in. better-auth's
  // two-factor plugin only intercepts /sign-in/email, so a social sign-in
  // would bypass the TOTP challenge and grant a full admin session.
  return (
    <AuthCard
      title="Admin Girisi"
      description="Admin panelinize erismek icin giris yapin."
      footerText="Sifreni mi unuttun?"
      footerHref="/admin/forgot-password"
      footerLabel="Sifirla"
    >
      <LoginForm redirectTo="/admin" googleEnabled={false} />
    </AuthCard>
  );
}
