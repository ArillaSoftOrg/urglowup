import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Globe, LogOut } from "lucide-react";
import { NotificationPreferencesForm } from "@/components/account/notification-preferences-form";
import { ConsentPreferencesForm } from "@/components/account/consent-preferences-form";
import { getUserPreferences } from "@/lib/preferences";

export const metadata = { title: "Ayarlar" };

const LOCALE_LABELS: Record<string, string> = {
  tr: "Türkçe",
  en: "English",
  de: "Deutsch",
  ru: "Русский",
  es: "Español",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const prefs = await getUserPreferences(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground">
          Hesap ve uygulama tercihlerinizi yönetin.
        </p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Hesap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Çıkış yap</p>
              <p className="text-sm text-muted-foreground">
                Hesabınızdan güvenli şekilde çıkış yapın.
              </p>
            </div>
            <SignOutButton>
              <Button variant="outline" size="sm">
                <LogOut className="mr-2 size-4" />
                Çıkış yap
              </Button>
            </SignOutButton>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-4" />
            Dil
          </CardTitle>
          <CardDescription>
            Tercih ettiğiniz dili gezinme çubuğundaki dil seçiciden değiştirebilirsiniz.
            {prefs.locale && (
              <span className="block mt-1 text-foreground font-medium">
                Kayıtlı tercihiniz: {LOCALE_LABELS[prefs.locale] ?? prefs.locale}
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Bildirimler</CardTitle>
          <CardDescription>
            E-posta ve WhatsApp bildirim tercihlerinizi yönetin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm prefs={prefs} />
        </CardContent>
      </Card>

      {/* Privacy / Consent */}
      <Card>
        <CardHeader>
          <CardTitle>Gizlilik ve Onay</CardTitle>
          <CardDescription>
            Verilerinizin nasıl kullanılacağını kontrol edin. KVKK ve GDPR kapsamında korunmaktadır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConsentPreferencesForm prefs={prefs} />
        </CardContent>
      </Card>
    </div>
  );
}
