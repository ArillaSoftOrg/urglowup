import "server-only";
import { db, ConsentAction, ConsentCategory, type Theme } from "@urglowup/db";

// Kept in sync by hand with apps/web/src/lib/consent-version.ts — bump both
// when the cookie/privacy policy changes materially.
export const CONSENT_VERSION = "2026-05";

export async function getUserPreferences(userId: string) {
  return db.userPreferences.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

/** Context captured by the caller (needs Next.js `headers()`), passed in for audit logging. */
export interface AuditContext {
  ipHash: string | null;
  userAgent: string | null;
}

export interface NotificationPreferencesInput {
  emailTransactional: boolean;
  whatsappTransactional: boolean;
  emailMarketingRequested: boolean;
  whatsappMarketingRequested: boolean;
}

function isMarketingConsentActive(prefs: {
  marketingConsentAt: Date | null;
  marketingRevokedAt: Date | null;
}): boolean {
  return (
    prefs.marketingConsentAt !== null &&
    (prefs.marketingRevokedAt === null || prefs.marketingConsentAt > prefs.marketingRevokedAt)
  );
}

export async function updateNotificationPreferences(
  userId: string,
  input: NotificationPreferencesInput,
): Promise<void> {
  const prefs = await getUserPreferences(userId);
  const marketingConsentActive = isMarketingConsentActive(prefs);
  const emailMarketing = marketingConsentActive ? input.emailMarketingRequested : false;
  const whatsappMarketing = marketingConsentActive ? input.whatsappMarketingRequested : false;

  const data = {
    emailTransactional: input.emailTransactional,
    whatsappTransactional: input.whatsappTransactional,
    emailMarketing,
    whatsappMarketing,
  };

  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function grantConsent(
  userId: string,
  category: ConsentCategory,
  audit: AuditContext,
): Promise<void> {
  const now = new Date();
  const updateData: Record<string, unknown> = { consentVersion: CONSENT_VERSION };
  if (category === ConsentCategory.PERSONALIZATION) {
    updateData.personalizationConsentAt = now;
    updateData.personalizationRevokedAt = null;
  } else if (category === ConsentCategory.ANALYTICS) {
    updateData.analyticsConsentAt = now;
    updateData.analyticsRevokedAt = null;
  } else if (category === ConsentCategory.MARKETING) {
    updateData.marketingConsentAt = now;
    updateData.marketingRevokedAt = null;
  }

  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, ...updateData },
    update: updateData,
  });

  await db.consentAuditLog.create({
    data: {
      userId,
      category,
      action: ConsentAction.GRANTED,
      version: CONSENT_VERSION,
      ipHash: audit.ipHash,
      userAgent: audit.userAgent,
    },
  });
}

export async function revokeConsent(
  userId: string,
  category: ConsentCategory,
  audit: AuditContext,
): Promise<void> {
  const now = new Date();
  const updateData: Record<string, unknown> = {};
  if (category === ConsentCategory.PERSONALIZATION) {
    updateData.personalizationRevokedAt = now;
    updateData.preferredCategoryIds = null;
    updateData.affinityComputedAt = null;
  } else if (category === ConsentCategory.ANALYTICS) {
    updateData.analyticsRevokedAt = now;
  } else if (category === ConsentCategory.MARKETING) {
    updateData.marketingRevokedAt = now;
    updateData.emailMarketing = false;
    updateData.whatsappMarketing = false;
  }

  await db.userPreferences.upsert({
    where: { userId },
    create: { userId },
    update: updateData,
  });

  await db.consentAuditLog.create({
    data: {
      userId,
      category,
      action: ConsentAction.REVOKED,
      version: CONSENT_VERSION,
      ipHash: audit.ipHash,
      userAgent: audit.userAgent,
    },
  });
}

export interface ParsedConsentCookie {
  analytics: boolean;
  marketing: boolean;
}

/**
 * Syncs browser-cookie consent → DB for the given user, once. No-ops if the
 * user already has a DB-level `consentVersion` (an explicit DB consent
 * action has already happened — never overrides it).
 */
export async function syncBrowserConsentIfNeeded(
  userId: string,
  parsedCookie: ParsedConsentCookie,
  audit: AuditContext,
): Promise<void> {
  const prefs = await getUserPreferences(userId);
  if (prefs.consentVersion !== null) return;

  const now = new Date();
  const updateData: Record<string, unknown> = { consentVersion: CONSENT_VERSION };

  if (parsedCookie.analytics) {
    updateData.analyticsConsentAt = now;
    updateData.analyticsRevokedAt = null;
  }
  if (parsedCookie.marketing) {
    updateData.marketingConsentAt = now;
    updateData.marketingRevokedAt = null;
  }

  await db.userPreferences.update({ where: { userId }, data: updateData });

  const categoriesToLog: ConsentCategory[] = [];
  if (parsedCookie.analytics) categoriesToLog.push(ConsentCategory.ANALYTICS);
  if (parsedCookie.marketing) categoriesToLog.push(ConsentCategory.MARKETING);

  for (const category of categoriesToLog) {
    await db.consentAuditLog.create({
      data: {
        userId,
        category,
        action: ConsentAction.GRANTED,
        version: CONSENT_VERSION,
        ipHash: audit.ipHash,
        userAgent: audit.userAgent,
      },
    });
  }
}

export async function acknowledgeConsentVersion(userId: string): Promise<void> {
  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, consentVersion: CONSENT_VERSION },
    update: { consentVersion: CONSENT_VERSION },
  });
}

export type NotificationField =
  | "emailTransactional"
  | "whatsappTransactional"
  | "emailMarketing"
  | "whatsappMarketing";

export type UpdateSingleNotificationPreferenceResult =
  | { ok: true }
  | { ok: false; reason: "MARKETING_CONSENT_REQUIRED" };

export async function updateSingleNotificationPreference(
  userId: string,
  field: NotificationField,
  value: boolean,
): Promise<UpdateSingleNotificationPreferenceResult> {
  if ((field === "emailMarketing" || field === "whatsappMarketing") && value) {
    const prefs = await getUserPreferences(userId);
    if (!isMarketingConsentActive(prefs)) {
      return { ok: false, reason: "MARKETING_CONSENT_REQUIRED" };
    }
  }

  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, [field]: value },
    update: { [field]: value },
  });

  return { ok: true };
}

export async function updateThemePreference(userId: string, theme: Theme): Promise<void> {
  await db.userPreferences.upsert({
    where: { userId },
    create: { userId, theme },
    update: { theme },
  });
}
