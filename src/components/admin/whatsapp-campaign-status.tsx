"use client";

import {
  getApprovedWhatsAppMarketingTemplates,
  getWhatsAppMarketingStatus,
} from "@/lib/whatsapp-marketing-config";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface WhatsAppCampaignStatusProps {
  templateName?: string;
  showTemplateSelector?: boolean;
}

export function WhatsAppCampaignStatus({
  templateName,
  showTemplateSelector,
}: WhatsAppCampaignStatusProps) {
  const [mounted, setMounted] = useState(false);
  const [templates, setTemplates] = useState<Array<{ name: string; language: string; description?: string }>>([]);
  const [status, setStatus] = useState<{
    ready: boolean;
    message: string;
  }>({ ready: false, message: "Loading..." });

  useEffect(() => {
    setMounted(true);
    const templates = getApprovedWhatsAppMarketingTemplates();
    const status = getWhatsAppMarketingStatus();
    setTemplates(templates);
    setStatus(status);
  }, []);

  if (!mounted) {
    return null;
  }

  const isTemplateValid = templateName && templates.some((t) => t.name === templateName);

  return (
    <div className="space-y-3">
      {/* Status banner */}
      <div
        className={`rounded-lg border p-3 flex gap-2 ${
          status.ready
            ? "border-green-200 bg-green-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        {status.ready ? (
          <CheckCircle2 className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <p
            className={`text-sm font-medium ${
              status.ready ? "text-green-900" : "text-amber-900"
            }`}
          >
            {status.message}
          </p>
          {templates.length > 0 && (
            <p className="text-xs text-amber-800 mt-1">
              Approved templates: {templates.map((t) => `"${t.name}"`).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Template selector info */}
      {showTemplateSelector && templates.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-700 mb-2">
            ℹ️ Template must be Meta-approved
          </p>
          {!isTemplateValid && templateName && (
            <div className="flex gap-2 text-xs text-red-600 mb-2">
              <AlertCircle className="size-4 flex-shrink-0" />
              <span>
                Template "{templateName}" is not approved. Select from the list.
              </span>
            </div>
          )}
          <div className="space-y-1">
            {templates.map((t) => (
              <div
                key={t.name}
                className="text-xs text-slate-600"
              >
                <span className="font-mono bg-slate-100 px-1 rounded">
                  {t.name}
                </span>
                <span className="text-slate-500 ml-2">({t.language})</span>
                {t.description && (
                  <p className="text-slate-500 ml-2 mt-1">{t.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send button disabled reason */}
      {!status.ready && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex gap-2">
          <AlertCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">
              Send disabled until configured
            </p>
            <p className="text-xs text-red-800 mt-1">
              {templates.length === 0
                ? "No WhatsApp marketing templates configured. Contact admin with Meta-approved template names."
                : "Set WHATSAPP_DRY_RUN=false in env to enable live sends."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
