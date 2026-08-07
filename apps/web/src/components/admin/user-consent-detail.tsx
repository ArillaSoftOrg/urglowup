"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const CONSENT_CATEGORY_LABELS = {
  PERSONALIZATION: "Personalization",
  ANALYTICS: "Analytics",
  MARKETING: "Marketing",
} as const;

type ConsentCategoryKey = keyof typeof CONSENT_CATEGORY_LABELS;
type ConsentDate = Date | string | null | undefined;

type ConsentPreferences = {
  consentVersion?: string | null;
  personalizationConsentAt?: ConsentDate;
  personalizationRevokedAt?: ConsentDate;
  analyticsConsentAt?: ConsentDate;
  analyticsRevokedAt?: ConsentDate;
  marketingConsentAt?: ConsentDate;
  marketingRevokedAt?: ConsentDate;
  emailTransactional?: boolean | null;
  whatsappTransactional?: boolean | null;
  emailMarketing?: boolean | null;
  whatsappMarketing?: boolean | null;
} | null;

type ConsentLog = {
  id: string;
  category: string;
  action: string;
  ipHash: string | null;
  createdAt: Date | string;
};

const CONSENT_VERSION = "2026-05";

function formatDateTime(date: ConsentDate): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ConsentStatus({
  grantedAt,
  revokedAt,
}: {
  grantedAt: ConsentDate;
  revokedAt: ConsentDate;
}) {
  if (revokedAt) {
    return (
      <div className="flex items-center gap-2">
        <XCircle className="size-4 text-red-600" />
        <span className="text-sm">Revoked</span>
      </div>
    );
  }
  if (grantedAt) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-4 text-green-600" />
        <span className="text-sm">Granted</span>
      </div>
    );
  }
  return <span className="text-sm text-muted-foreground">Never given</span>;
}

interface UserConsentDetailProps {
  preferences: ConsentPreferences;
  consentLogs: ConsentLog[];
}

export function UserConsentDetail({
  preferences,
  consentLogs,
}: UserConsentDetailProps) {
  const versionMismatch =
    preferences?.consentVersion && preferences.consentVersion !== CONSENT_VERSION;

  const categorizedLogs: Record<ConsentCategoryKey, ConsentLog[]> = {
    PERSONALIZATION: [],
    ANALYTICS: [],
    MARKETING: [],
  };

  for (const log of consentLogs) {
    if (log.category in categorizedLogs) {
      const category = log.category as ConsentCategoryKey;
      categorizedLogs[category].push(log);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consent & Marketing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {versionMismatch && (
          <div className="border border-yellow-200 bg-yellow-50 p-3 rounded flex gap-2 items-start">
            <AlertTriangle className="size-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              User&apos;s consent version ({preferences?.consentVersion}) does not
              match current policy ({CONSENT_VERSION}). Will trigger re-consent
              on next visit.
            </div>
          </div>
        )}

        {/* Consent Timeline */}
        <div className="space-y-4">
          <h3 className="font-medium">Consent Timeline</h3>
          <div className="space-y-4">
            {(["PERSONALIZATION", "ANALYTICS", "MARKETING"] as const).map((category) => (
              <div key={category} className="p-3 bg-muted rounded space-y-2">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm">
                    {CONSENT_CATEGORY_LABELS[category]}
                  </p>
                  <ConsentStatus
                    grantedAt={
                      category === "PERSONALIZATION"
                        ? preferences?.personalizationConsentAt ?? null
                        : category === "ANALYTICS"
                          ? preferences?.analyticsConsentAt ?? null
                          : preferences?.marketingConsentAt ?? null
                    }
                    revokedAt={
                      category === "PERSONALIZATION"
                        ? preferences?.personalizationRevokedAt ?? null
                        : category === "ANALYTICS"
                          ? preferences?.analyticsRevokedAt ?? null
                          : preferences?.marketingRevokedAt ?? null
                    }
                  />
                </div>

                {categorizedLogs[category]
                  .length > 0 ? (
                  <div className="text-xs space-y-1 mt-2">
                    {[...categorizedLogs[category]]
                      .reverse()
                      .map((log) => (
                        <div key={log.id} className="flex justify-between text-muted-foreground">
                          <span>
                            {log.action === "GRANTED" ? "✓ Granted" : "✗ Revoked"}
                            {log.ipHash && ` (${log.ipHash.slice(0, 8)}...)`}
                          </span>
                          <span>{formatDateTime(log.createdAt)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    No consent activity recorded
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Marketing Channels */}
        <div className="space-y-4">
          <h3 className="font-medium">Marketing Channels</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Channel</th>
                <th className="text-center py-2 px-2">Transactional</th>
                <th className="text-center py-2 px-2">Marketing</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-2">Email</td>
                <td className="text-center py-2 px-2">
                  {preferences?.emailTransactional ? (
                    <CheckCircle2 className="size-4 text-green-600 mx-auto" />
                  ) : (
                    <XCircle className="size-4 text-gray-400 mx-auto" />
                  )}
                </td>
                <td className="text-center py-2 px-2">
                  {preferences?.emailMarketing ? (
                    <CheckCircle2 className="size-4 text-green-600 mx-auto" />
                  ) : (
                    <XCircle className="size-4 text-gray-400 mx-auto" />
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2 px-2">WhatsApp</td>
                <td className="text-center py-2 px-2">
                  {preferences?.whatsappTransactional ? (
                    <CheckCircle2 className="size-4 text-green-600 mx-auto" />
                  ) : (
                    <XCircle className="size-4 text-gray-400 mx-auto" />
                  )}
                </td>
                <td className="text-center py-2 px-2">
                  {preferences?.whatsappMarketing ? (
                    <CheckCircle2 className="size-4 text-green-600 mx-auto" />
                  ) : (
                    <XCircle className="size-4 text-gray-400 mx-auto" />
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
