"use server";

import { createHash } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserPreferences } from "@/lib/preferences";
import { ConsentAction, ConsentCategory, Theme } from "@/generated/prisma/enums";
import { CONSENT_VERSION } from "@/lib/consent-version";
import { parseConsentCookie } from "@/lib/cookies";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

export type PreferencesFormState = {
  success: boolean;
  message?: string;
};

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Produce a SHA-256 hex digest of the request IP (no raw IP stored). */
async function getIpHash(): Promise<string | null> {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;
    if (!ip) return null;
    return createHash("sha256").update(ip).digest("hex");
  } catch {
    return null;
  }
}

// ── Notification Preferences ──────────────────────────────────────────────────

export async function updateNotificationPreferences(
  _prevState: PreferencesFormState,
  formData: FormData
): Promise<PreferencesFormState> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const emailTransactional = formData.get("emailTransactional") === "on";
  const whatsappTransactional = formData.get("whatsappTransactional") === "on";
  const emailMarketingRequested = formData.get("emailMarketing") === "on";
  const whatsappMarketingRequested = formData.get("whatsappMarketing") === "on";

  // Marketing channels can only be enabled when active marketing consent exists
  const prefs = await getUserPreferences(user.id);
  const marketingConsentActive =
    prefs.marketingConsentAt !== null &&
    (prefs.marketingRevokedAt === null || prefs.marketingConsentAt > prefs.marketingRevokedAt);
  const emailMarketing = marketingConsentActive ? emailMarketingRequested : false;
  const whatsappMarketing = marketingConsentActive ? whatsappMarketingRequested : false;

  await db.userPreferences.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      emailTransactional,
      whatsappTransactional,
      emailMarketing,
      whatsappMarketing,
    },
    update: {
      emailTransactional,
      whatsappTransactional,
      emailMarketing,
      whatsappMarketing,
    },
  });

  revalidatePath("/account/settings");
  return { success: true, message: "Bildirim tercihleri güncellendi." };
}

// ── Consent Preferences ───────────────────────────────────────────────────────

export async function grantConsent(
  category: ConsentCategory
): Promise<PreferencesFormState> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

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
    where: { userId: user.id },
    create: { userId: user.id, ...updateData },
    update: updateData,
  });

  const [ipHash, h] = await Promise.all([getIpHash(), headers()]);
  const userAgent = h.get("user-agent")?.slice(0, 512) ?? null;

  await db.consentAuditLog.create({
    data: {
      userId: user.id,
      category,
      action: ConsentAction.GRANTED,
      version: CONSENT_VERSION,
      ipHash,
      userAgent,
    },
  });

  revalidatePath("/account/settings");
  return { success: true };
}

export async function revokeConsent(
  category: ConsentCategory
): Promise<PreferencesFormState> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const now = new Date();

  const updateData: Record<string, unknown> = {};
  if (category === ConsentCategory.PERSONALIZATION) {
    updateData.personalizationRevokedAt = now;
    // Clear cached affinity on revocation
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
    where: { userId: user.id },
    create: { userId: user.id },
    update: updateData,
  });

  const [ipHash, h] = await Promise.all([getIpHash(), headers()]);
  const userAgent = h.get("user-agent")?.slice(0, 512) ?? null;

  await db.consentAuditLog.create({
    data: {
      userId: user.id,
      category,
      action: ConsentAction.REVOKED,
      version: CONSENT_VERSION,
      ipHash,
      userAgent,
    },
  });

  revalidatePath("/account/settings");
  return { success: true };
}

/**
 * Sync browser-cookie consent → DB for the current authenticated user.
 * No-ops if:
 *  - User is unauthenticated
 *  - `consentVersion` is already set in DB (user has made a DB-level consent choice)
 *  - The cookie value is absent or unrecognisable
 *
 * Called from the account layout on every authenticated visit; the early-return
 * on `consentVersion` check ensures it only performs DB writes once.
 */
export async function syncBrowserConsentIfNeeded(
  consentCookieValue: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const prefs = await getUserPreferences(user.id);

  // Already synced from an explicit DB consent action — don't override
  if (prefs.consentVersion !== null) return;

  const parsed = parseConsentCookie(consentCookieValue);
  if (!parsed) return;

  const now = new Date();
  const updateData: Record<string, unknown> = { consentVersion: CONSENT_VERSION };

  if (parsed.analytics) {
    updateData.analyticsConsentAt = now;
    updateData.analyticsRevokedAt = null;
  }
  if (parsed.marketing) {
    updateData.marketingConsentAt = now;
    updateData.marketingRevokedAt = null;
  }

  await db.userPreferences.update({
    where: { userId: user.id },
    data: updateData,
  });

  // Write audit log entries for every synced category
  const [ipHash, h] = await Promise.all([getIpHash(), headers()]);
  const userAgent = h.get("user-agent")?.slice(0, 512) ?? null;

  const categoriesToLog: ConsentCategory[] = [];
  if (parsed.analytics) categoriesToLog.push(ConsentCategory.ANALYTICS);
  if (parsed.marketing) categoriesToLog.push(ConsentCategory.MARKETING);

  for (const category of categoriesToLog) {
    await db.consentAuditLog.create({
      data: {
        userId: user.id,
        category,
        action: ConsentAction.GRANTED,
        version: CONSENT_VERSION,
        ipHash,
        userAgent,
      },
    });
  }
}

/**
 * Record that the current authenticated user has acknowledged the latest
 * CONSENT_VERSION without changing any existing consent choices.
 * Called from the cookie banner when `requiresReConsent` is true.
 */
export async function acknowledgeConsentVersion(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await db.userPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id, consentVersion: CONSENT_VERSION },
    update: { consentVersion: CONSENT_VERSION },
  });
}

// ── Single notification preference toggle ─────────────────────────────────────

type NotificationField =
  | "emailTransactional"
  | "whatsappTransactional"
  | "emailMarketing"
  | "whatsappMarketing";

export async function updateSingleNotificationPreference(
  field: NotificationField,
  value: boolean
): Promise<PreferencesFormState> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  if ((field === "emailMarketing" || field === "whatsappMarketing") && value) {
    const prefs = await getUserPreferences(user.id);
    const marketingConsentActive =
      prefs.marketingConsentAt !== null &&
      (prefs.marketingRevokedAt === null ||
        prefs.marketingConsentAt > prefs.marketingRevokedAt);
    if (!marketingConsentActive)
      return { success: false, message: "Pazarlama onayı gereklidir." };
  }

  await db.userPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id, [field]: value },
    update: { [field]: value },
  });

  revalidatePath("/account/settings");
  return { success: true };
}

// ── Get preferences (for server components) ───────────────────────────────────

export async function getMyPreferences() {
  const user = await getCurrentUser();
  if (!user) return null;
  return getUserPreferences(user.id);
}

// ── Theme Preference ──────────────────────────────────────────────────────────

const VALID_THEMES = new Set<string>(["LIGHT", "DARK", "SYSTEM"]);

export async function updateThemePreference(
  theme: Theme
): Promise<PreferencesFormState> {
  if (!VALID_THEMES.has(theme)) {
    return { success: false, message: "Invalid theme" };
  }

  const jar = await cookies();
  jar.set("ugl_theme", theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const user = await getCurrentUser();
  if (user) {
    await db.userPreferences.upsert({
      where: { userId: user.id },
      create: { userId: user.id, theme },
      update: { theme },
    });
    revalidatePath("/account/settings");
  }

  return { success: true, message: "Tema güncellendi." };
}
