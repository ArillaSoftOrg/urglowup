"use server";

import { createHash } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { ConsentCategory, Theme } from "@/generated/prisma/enums";
import { parseConsentCookie } from "@/lib/cookies";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import {
  getUserPreferences,
  updateNotificationPreferences as updateNotificationPreferencesForUser,
  grantConsent as grantConsentForUser,
  revokeConsent as revokeConsentForUser,
  syncBrowserConsentIfNeeded as syncBrowserConsentIfNeededForUser,
  acknowledgeConsentVersion as acknowledgeConsentVersionForUser,
  updateSingleNotificationPreference as updateSingleNotificationPreferenceForUser,
  updateThemePreference as updateThemePreferenceForUser,
  type AuditContext,
} from "@urglowup/domain/accounts";

export type PreferencesFormState = {
  success: boolean;
  message?: string;
};

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Produce a SHA-256 hex digest of the request IP (no raw IP stored). */
async function getAuditContext(): Promise<AuditContext> {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
    const ipHash = ip ? createHash("sha256").update(ip).digest("hex") : null;
    const userAgent = h.get("user-agent")?.slice(0, 512) ?? null;
    return { ipHash, userAgent };
  } catch {
    return { ipHash: null, userAgent: null };
  }
}

// ── Notification Preferences ──────────────────────────────────────────────────

export async function updateNotificationPreferences(
  _prevState: PreferencesFormState,
  formData: FormData
): Promise<PreferencesFormState> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  await updateNotificationPreferencesForUser(user.id, {
    emailTransactional: formData.get("emailTransactional") === "on",
    whatsappTransactional: formData.get("whatsappTransactional") === "on",
    emailMarketingRequested: formData.get("emailMarketing") === "on",
    whatsappMarketingRequested: formData.get("whatsappMarketing") === "on",
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

  await grantConsentForUser(user.id, category, await getAuditContext());

  revalidatePath("/account/settings");
  return { success: true };
}

export async function revokeConsent(
  category: ConsentCategory
): Promise<PreferencesFormState> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  await revokeConsentForUser(user.id, category, await getAuditContext());

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

  const parsed = parseConsentCookie(consentCookieValue);
  if (!parsed) return;

  await syncBrowserConsentIfNeededForUser(user.id, parsed, await getAuditContext());
}

/**
 * Record that the current authenticated user has acknowledged the latest
 * CONSENT_VERSION without changing any existing consent choices.
 * Called from the cookie banner when `requiresReConsent` is true.
 */
export async function acknowledgeConsentVersion(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await acknowledgeConsentVersionForUser(user.id);
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

  const result = await updateSingleNotificationPreferenceForUser(user.id, field, value);
  if (!result.ok) {
    return { success: false, message: "Pazarlama onayı gereklidir." };
  }

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
    await updateThemePreferenceForUser(user.id, theme);
    revalidatePath("/account/settings");
  }

  return { success: true, message: "Tema güncellendi." };
}
