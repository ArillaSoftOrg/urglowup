import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { NotificationPreferencesForm } from "@/components/account/notification-preferences-form";
import { ConsentPreferencesForm } from "@/components/account/consent-preferences-form";
import { ThemeSelector } from "@/components/account/theme-selector";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { getUserPreferences } from "@/lib/preferences";
import { signOutAction } from "@/app/(auth)/actions";

export const metadata = { title: "Ayarlar" };

function isMarketingConsentActive(prefs: {
  marketingConsentAt: Date | null;
  marketingRevokedAt: Date | null;
}): boolean {
  if (!prefs.marketingConsentAt) return false;
  if (!prefs.marketingRevokedAt) return true;
  return prefs.marketingConsentAt > prefs.marketingRevokedAt;
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const prefs = await getUserPreferences(user.id);
  const marketingConsentActive = isMarketingConsentActive(prefs);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground">
          Hesap ve uygulama tercihlerinizi yönetin.
        </p>
      </div>

      {/* 1 — Account */}
      <Card>
        <CardHeader>
          <CardTitle>Hesap</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Çıkış yap</p>
              <p className="text-sm text-muted-foreground">
                Hesabınızdan güvenli şekilde çıkış yapın.
              </p>
            </div>
            <form action={signOutAction}>
              <Button variant="outline" size="sm">
                <LogOut className="mr-2 size-4" />
                Çıkış yap
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* 2 — Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Görünüm</CardTitle>
          <CardDescription>
            Uygulama temasını tercihlerinize göre ayarlayın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector initialTheme={prefs.theme ?? "SYSTEM"} />
        </CardContent>
      </Card>

      {/* 3 — Language */}
      <Card>
        <CardHeader>
          <CardTitle>Dil</CardTitle>
          <CardDescription>
            Tercih ettiğiniz arayüz dilini seçin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocaleSwitcher
            isLoggedIn
            variant="settings"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            savedLocale={(prefs.locale ?? undefined) as any}
          />
        </CardContent>
      </Card>

      {/* 4 — Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Bildirimler</CardTitle>
          <CardDescription>
            E-posta ve WhatsApp bildirim tercihlerinizi yönetin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm
            prefs={prefs}
            marketingConsentActive={marketingConsentActive}
          />
        </CardContent>
      </Card>

      {/* 5 — Privacy & Consent */}
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
