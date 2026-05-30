/**
 * WhatsApp Marketing Template Configuration (Phase 4)
 * Manages approved Meta templates for marketing campaigns.
 * Safe mode: WHATSAPP_DRY_RUN=true by default.
 */

export interface WhatsAppMarketingTemplate {
  name: string;
  language: string;
  description?: string;
}

/**
 * Parse approved WhatsApp marketing templates from env var.
 * Format: JSON array of { name, language, description }
 * Returns empty array if not configured (safe default for Phase 4 pre-approval).
 */
export function getApprovedWhatsAppMarketingTemplates(): WhatsAppMarketingTemplate[] {
  const configJson = process.env.WHATSAPP_MARKETING_TEMPLATES || "";

  if (!configJson.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(configJson);
    if (!Array.isArray(parsed)) {
      console.error(
        "WHATSAPP_MARKETING_TEMPLATES must be a JSON array. Got:",
        typeof parsed
      );
      return [];
    }

    return parsed.filter(
      (item) =>
        item.name &&
        typeof item.name === "string" &&
        item.language &&
        typeof item.language === "string"
    );
  } catch (err) {
    console.error("Failed to parse WHATSAPP_MARKETING_TEMPLATES:", err);
    return [];
  }
}

/**
 * Check if a template name is approved for marketing campaigns.
 */
export function isApprovedMarketingTemplate(templateName: string): boolean {
  const approved = getApprovedWhatsAppMarketingTemplates();
  return approved.some((t) => t.name === templateName);
}

/**
 * Check if WhatsApp marketing is fully configured and ready.
 * Returns false if:
 * - No approved templates configured
 * - WHATSAPP_DRY_RUN is true (safe mode)
 * - Required env vars missing
 */
export function isWhatsAppMarketingReady(): boolean {
  // Must have at least one approved template
  if (getApprovedWhatsAppMarketingTemplates().length === 0) {
    return false;
  }

  // Must be in live mode (not dry-run)
  if (process.env.WHATSAPP_DRY_RUN === "true") {
    return false;
  }

  // Must have required credentials
  if (
    !process.env.WHATSAPP_PHONE_NUMBER_ID ||
    !process.env.WHATSAPP_ACCESS_TOKEN
  ) {
    return false;
  }

  return true;
}

/**
 * Get a user-facing status message for WhatsApp marketing readiness.
 */
export function getWhatsAppMarketingStatus(): {
  ready: boolean;
  message: string;
} {
  const templates = getApprovedWhatsAppMarketingTemplates();
  const dryRun = process.env.WHATSAPP_DRY_RUN === "true";

  if (templates.length === 0) {
    return {
      ready: false,
      message:
        "⚠️ No WhatsApp marketing templates configured. Awaiting Meta approval. Contact admin to set WHATSAPP_MARKETING_TEMPLATES env var.",
    };
  }

  if (dryRun) {
    return {
      ready: false,
      message: `⚠️ WhatsApp marketing in DRY-RUN mode. ${templates.length} template(s) approved. Set WHATSAPP_DRY_RUN=false to enable live sends.`,
    };
  }

  if (
    !process.env.WHATSAPP_PHONE_NUMBER_ID ||
    !process.env.WHATSAPP_ACCESS_TOKEN
  ) {
    return {
      ready: false,
      message:
        "⚠️ WhatsApp credentials missing (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN).",
    };
  }

  return {
    ready: true,
    message: `✅ WhatsApp marketing ready. ${templates.length} template(s) approved and live mode enabled.`,
  };
}
