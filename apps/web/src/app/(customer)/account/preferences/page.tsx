import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserPreferences } from "@/lib/preferences";
import { ConsentPreferencesForm } from "@/components/account/consent-preferences-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NotificationPreferencesForm } from "@/components/account/notification-preferences-form";

export const metadata = { title: "Tercihler" };

function isMarketingConsentActive(prefs: {
  marketingConsentAt: Date | null;
  marketingRevokedAt: Date | null;
}): boolean {
  if (!prefs.marketingConsentAt) return false;
  if (!prefs.marketingRevokedAt) return true;
  return prefs.marketingConsentAt > prefs.marketingRevokedAt;
}

export default async function PreferencesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const prefs = await getUserPreferences(user.id);
  const marketingConsentActive = isMarketingConsentActive(prefs);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tercihler</h1>
        <p className="text-muted-foreground">
          Bildirim ve gizlilik tercihlerinizi yönetin.
        </p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Gizlilik ve Onay</CardTitle>
          <CardDescription>
            Verilerinizin nasıl kullanılacağını kontrol edin. KVKK ve GDPR
            kapsamında korunmaktadır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConsentPreferencesForm prefs={prefs} />
        </CardContent>
      </Card>
    </div>
  );
}
