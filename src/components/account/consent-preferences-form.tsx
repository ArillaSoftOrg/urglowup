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
        title="Ki\u015fiselle\u015ftirme"
        description="Kaydetti\u011finiz i\u00e7erikler ve rezervasyonlar\u0131n\u0131za g\u00f6re Ke\u015ffet ak\u0131\u015f\u0131n\u0131 ki\u015fiselle\u015ftirmemize izin verin."
        active={personalizationActive}
        disabled={pending}
        onToggle={() => toggle(ConsentCategory.PERSONALIZATION, personalizationActive)}
      />
      <ConsentRow
        icon={<BarChart2 className="size-4 text-muted-foreground shrink-0" />}
        title="Analitik"
        description="Platformu iyile\u015ftirmek i\u00e7in gezinme davran\u0131\u015f\u0131n\u0131z\u0131n anonim olarak analiz edilmesine izin verin."
        active={analyticsActive}
        disabled={pending}
        onToggle={() => toggle(ConsentCategory.ANALYTICS, analyticsActive)}
      />
      <ConsentRow
        icon={<Megaphone className="size-4 text-muted-foreground shrink-0" />}
        title="Pazarlama"
        description="Kampanya ve \u00f6zel teklifler i\u00e7in ileti\u015fim almay\u0131 kabul edin."
        active={marketingActive}
        disabled={pending}
        onToggle={() => toggle(ConsentCategory.MARKETING, marketingActive)}
      />
      <p className="text-xs text-muted-foreground">
        {"Bu se\u00e7imler KVKK ve GDPR kapsam\u0131nda g\u00fcvenli \u015fekilde saklan\u0131r. \u0130stedi\u011finiz zaman geri alabilirsiniz."}
      </p>
    </div>
  );
}

interface ConsentRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function ConsentRow({ icon, title, description, active, disabled, onToggle }: ConsentRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        {icon}
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button
        variant={active ? "default" : "outline"}
        size="sm"
        disabled={disabled}
        onClick={onToggle}
        className="shrink-0 text-xs"
      >
        {active ? "Etkin" : "Devre d\u0131\u015f\u0131"}
      </Button>
    </div>
  );
}
