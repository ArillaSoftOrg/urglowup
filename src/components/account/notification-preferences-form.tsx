"use client";

import { useTransition, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateSingleNotificationPreference } from "@/app/(customer)/account/preferences/actions";
import type { UserPreferencesModel as UserPreferences } from "@/generated/prisma/models";

interface NotificationPreferencesFormProps {
  prefs: Pick<
    UserPreferences,
    "emailTransactional" | "whatsappTransactional" | "emailMarketing" | "whatsappMarketing"
  >;
  marketingConsentActive: boolean;
}

type NotificationField = "emailTransactional" | "whatsappTransactional" | "emailMarketing";

export function NotificationPreferencesForm({
  prefs,
  marketingConsentActive,
}: NotificationPreferencesFormProps) {
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<NotificationField, boolean>>({
    emailTransactional: prefs.emailTransactional,
    whatsappTransactional: prefs.whatsappTransactional,
    emailMarketing: prefs.emailMarketing,
  });

  function toggle(field: NotificationField) {
    const next = !values[field];
    setValues((v) => ({ ...v, [field]: next }));
    startTransition(async () => {
      await updateSingleNotificationPreference(field, next);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">İşlem bildirimleri</p>
          <p className="text-xs text-muted-foreground">
            Randevu onayı, iptal ve hatırlatıcılar gibi önemli bildirimler.
          </p>
        </div>
        <ToggleRow
          icon={<Mail className="size-4 shrink-0 text-muted-foreground" />}
          label="E-posta bildirimleri"
          description="Randevu güncelleme ve hatırlatıcıları e-posta ile al."
          active={values.emailTransactional}
          disabled={pending}
          onToggle={() => toggle("emailTransactional")}
        />
        <ToggleRow
          icon={<MessageCircle className="size-4 shrink-0 text-muted-foreground" />}
          label="WhatsApp bildirimleri"
          description="Randevu onaylarını WhatsApp üzerinden al."
          active={values.whatsappTransactional}
          disabled={pending}
          onToggle={() => toggle("whatsappTransactional")}
        />
      </div>

      <div className="space-y-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Pazarlama bildirimleri</p>
          <p className="text-xs text-muted-foreground">
            Kampanya, promosyon ve öneriler. Ayrı onay gerektirir.
          </p>
        </div>
        <ToggleRow
          icon={<Mail className="size-4 shrink-0 text-muted-foreground" />}
          label="Pazarlama e-postaları"
          description={
            marketingConsentActive
              ? "Kampanya ve fırsatlardan haberdar ol."
              : "Etkinleştirmek için aşağıdaki Gizlilik bölümünden pazarlama onayı verin."
          }
          active={values.emailMarketing && marketingConsentActive}
          disabled={pending || !marketingConsentActive}
          onToggle={() => toggle("emailMarketing")}
        />
      </div>
    </div>
  );
}

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function ToggleRow({ icon, label, description, active, disabled, onToggle }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        {icon}
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{label}</p>
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
        {active ? "Etkin" : "Devre dışı"}
      </Button>
    </div>
  );
}
