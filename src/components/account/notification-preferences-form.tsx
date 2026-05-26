"use client";

import { useActionState, useEffect, useRef } from "react";
import { Bell, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateNotificationPreferences } from "@/app/(customer)/account/preferences/actions";
import type { UserPreferencesModel as UserPreferences } from "@/generated/prisma/models";

interface NotificationPreferencesFormProps {
  prefs: Pick<
    UserPreferences,
    "emailTransactional" | "whatsappTransactional" | "emailMarketing" | "whatsappMarketing"
  >;
}

const initial = { success: false, message: undefined as string | undefined };

export function NotificationPreferencesForm({ prefs }: NotificationPreferencesFormProps) {
  const [state, action, pending] = useActionState(updateNotificationPreferences, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      // Brief confirmation — no full reload needed
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{"\u0130\u015flem bildirimleri"}</p>
        <p className="text-xs text-muted-foreground">
          {"Randevu onay\u0131, iptal ve hat\u0131rlat\u0131c\u0131lar gibi \u00f6nemli bildirimler."}
        </p>
      </div>

      <div className="space-y-3">
        <ToggleRow
          name="emailTransactional"
          defaultChecked={prefs.emailTransactional}
          icon={<Mail className="size-4 shrink-0 text-muted-foreground" />}
          label="E-posta bildirimleri"
          description="Randevu g\u00fcncelleme ve hat\u0131rlat\u0131c\u0131lar\u0131 e-posta ile al."
          warning="Devre d\u0131\u015f\u0131 b\u0131rak\u0131rsan\u0131z randevu g\u00fcncellemelerini ka\u00e7\u0131rabilirsiniz."
        />
        <ToggleRow
          name="whatsappTransactional"
          defaultChecked={prefs.whatsappTransactional}
          icon={<MessageCircle className="size-4 shrink-0 text-muted-foreground" />}
          label="WhatsApp bildirimleri"
          description="Randevu onaylar\u0131n\u0131 WhatsApp \u00fczerinden al."
          warning="Devre d\u0131\u015f\u0131 b\u0131rak\u0131rsan\u0131z randevu g\u00fcncellemelerini ka\u00e7\u0131rabilirsiniz."
        />
      </div>

      <div className="space-y-1 pt-2">
        <p className="text-sm font-semibold">Pazarlama bildirimleri</p>
        <p className="text-xs text-muted-foreground">
          {"Kampanya, promosyon ve \u00f6neriler. Ayr\u0131 onay gerektirir."}
        </p>
      </div>

      <div className="space-y-3">
        <ToggleRow
          name="emailMarketing"
          defaultChecked={prefs.emailMarketing}
          icon={<Bell className="size-4 shrink-0 text-muted-foreground" />}
          label="Pazarlama e-postalar\u0131"
          description="Kampanya ve f\u0131rsatlardan haberdar ol."
        />
      </div>

      {state.message && (
        <p className={`text-xs ${state.success ? "text-green-600" : "text-destructive"}`}>
          {state.message}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Kaydediliyor\u2026" : "Kaydet"}
      </Button>
    </form>
  );
}

interface ToggleRowProps {
  name: string;
  defaultChecked: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  warning?: string;
}

function ToggleRow({ name, defaultChecked, icon, label, description, warning }: ToggleRowProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 rounded accent-foreground"
      />
      <div className="flex gap-2 items-start min-w-0">
        {icon}
        <div className="space-y-0.5">
          <p className="text-sm font-medium leading-none">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {warning && (
            <p className="text-xs text-amber-600">{warning}</p>
          )}
        </div>
      </div>
    </label>
  );
}
