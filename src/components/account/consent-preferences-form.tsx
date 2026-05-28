"use client";

import { useTransition } from "react";
import { ShieldCheck, BarChart2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { grantConsent, revokeConsent } from "@/app/(customer)/account/preferences/actions";
import { ConsentCategory } from "@/generated/prisma/enums";
import type { UserPreferencesModel as UserPreferences } from "@/generated/prisma/models";

interface ConsentPreferencesFormProps {
  prefs: Pick<
    UserPreferences,
    | "personalizationConsentAt"
    | "personalizationRevokedAt"
    | "analyticsConsentAt"
    | "analyticsRevokedAt"
    | "marketingConsentAt"
    | "marketingRevokedAt"
  >;
}

function isActive(consentAt: Date | null, revokedAt: Date | null): boolean {
  if (!consentAt) return false;
  if (!revokedAt) return true;
  return consentAt > revokedAt;
}

export function ConsentPreferencesForm({ prefs }: ConsentPreferencesFormProps) {
  const [pending, startTransition] = useTransition();

  function toggle(category: ConsentCategory, active: boolean) {
    startTransition(async () => {
      if (active) {
        await revokeConsent(category);
      } else {
        await grantConsent(category);
      }
    });
  }

  const personalizationActive = isActive(
    prefs.personalizationConsentAt,
    prefs.personalizationRevokedAt
  );
  const analyticsActive = isActive(prefs.analyticsConsentAt, prefs.analyticsRevokedAt);
  const marketingActive = isActive(prefs.marketingConsentAt, prefs.marketingRevokedAt);

  return (
    <div className="space-y-4">
      <ConsentRow
        icon={<ShieldCheck className="size-4 text-muted-foreground shrink-0" />}
        title="Kişiselleştirme"
        description="Kaydettiğiniz içerikler ve rezervasyonlarınıza göre Keşfet akışını kişiselleştirmemize izin verin."
        active={personalizationActive}
        disabled={pending}
        onToggle={() => toggle(ConsentCategory.PERSONALIZATION, personalizationActive)}
      />
      <ConsentRow
        icon={<BarChart2 className="size-4 text-muted-foreground shrink-0" />}
        title="Analitik"
        description="Platformu iyileştirmek için gezinme davranışınızın anonim olarak analiz edilmesine izin verin."
        active={analyticsActive}
        disabled={pending}
        onToggle={() => toggle(ConsentCategory.ANALYTICS, analyticsActive)}
      />
      <ConsentRow
        icon={<Megaphone className="size-4 text-muted-foreground shrink-0" />}
        title="Pazarlama"
        description="Kampanya ve özel teklifler için iletişim almayı kabul edin."
        note="Bu ayar, yukarıdaki pazarlama bildirim tercihini etkiler."
        active={marketingActive}
        disabled={pending}
        onToggle={() => toggle(ConsentCategory.MARKETING, marketingActive)}
      />
      <p className="text-xs text-muted-foreground">
        Bu seçimler KVKK ve GDPR kapsamında güvenli şekilde saklanır. İstediğiniz zaman geri alabilirsiniz.{" "}
        <a href="/kvkk" className="underline underline-offset-4 hover:text-foreground">
          KVKK Aydınlatma Metni
        </a>{" "}
        ·{" "}
        <a href="/privacy-policy" className="underline underline-offset-4 hover:text-foreground">
          Gizlilik Politikası
        </a>
      </p>
    </div>
  );
}

interface ConsentRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  note?: string;
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function ConsentRow({ icon, title, description, note, active, disabled, onToggle }: ConsentRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        {icon}
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {note && <p className="text-xs text-muted-foreground/70 italic">{note}</p>}
        </div>
      </div>
      <Button
        variant={active ? "default" : "outline"}
        size="sm"
        disabled={disabled}
        onClick={onToggle}
        className="shrink-0 text-xs"
      >
        {active ? "Etkin" : "Devre dışı"}
      </Button>
    </div>
  );
}
