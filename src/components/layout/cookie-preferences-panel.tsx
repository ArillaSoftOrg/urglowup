"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/dictionaries/tr";

interface CookiePreferencesPanelProps {
  analytics: boolean;
  marketing: boolean;
  onAnalyticsChange: (value: boolean) => void;
  onMarketingChange: (value: boolean) => void;
  onSave: () => void;
  onAcceptAll: () => void;
  dict: Dictionary["cookieConsent"];
}

export function CookiePreferencesPanel({
  analytics,
  marketing,
  onAnalyticsChange,
  onMarketingChange,
  onSave,
  onAcceptAll,
  dict,
}: CookiePreferencesPanelProps) {
  return (
    <div className="space-y-3">
      {/* Strictly Necessary — always on, locked */}
      <PanelRow
        title={dict.necessaryTitle}
        description={dict.necessaryDesc}
        locked
        alwaysActiveLabel={dict.alwaysActive}
      />

      {/* Preference — always on, locked */}
      <PanelRow
        title={dict.preferenceTitle}
        description={dict.preferenceDesc}
        locked
        alwaysActiveLabel={dict.alwaysActive}
      />

      {/* Analytics — user-toggleable */}
      <PanelRow
        title={dict.analyticsTitle}
        description={dict.analyticsDesc}
        active={analytics}
        onToggle={() => onAnalyticsChange(!analytics)}
        enabledLabel={dict.enabled}
        disabledLabel={dict.disabled}
      />

      {/* Marketing — user-toggleable */}
      <PanelRow
        title={dict.marketingTitle}
        description={dict.marketingDesc}
        active={marketing}
        onToggle={() => onMarketingChange(!marketing)}
        enabledLabel={dict.enabled}
        disabledLabel={dict.disabled}
      />

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" onClick={onSave}>
          {dict.savePreferences}
        </Button>
        <Button variant="outline" size="sm" onClick={onAcceptAll}>
          {dict.acceptAll}
        </Button>
      </div>
    </div>
  );
}

// ── Internal row component ────────────────────────────────────────────────────

interface PanelRowProps {
  title: string;
  description: string;
  /** When true the row shows a lock badge instead of a toggle button. */
  locked?: boolean;
  /** For locked rows: the "Always active" label. */
  alwaysActiveLabel?: string;
  active?: boolean;
  onToggle?: () => void;
  enabledLabel?: string;
  disabledLabel?: string;
}

function PanelRow({
  title,
  description,
  locked,
  alwaysActiveLabel,
  active,
  onToggle,
  enabledLabel,
  disabledLabel,
}: PanelRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-0.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {locked ? (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3" aria-hidden />
          {alwaysActiveLabel}
        </span>
      ) : (
        <Button
          variant={active ? "default" : "outline"}
          size="sm"
          onClick={onToggle}
          className="shrink-0 text-xs"
          aria-pressed={active}
        >
          {active ? enabledLabel : disabledLabel}
        </Button>
      )}
    </div>
  );
}
