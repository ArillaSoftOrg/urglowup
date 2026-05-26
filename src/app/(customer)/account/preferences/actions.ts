"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserPreferences } from "@/lib/preferences";
import { ConsentAction, ConsentCategory } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";

export type PreferencesFormState = {
  success: boolean;
  message?: string;
};

// ── Notification Preferences ──────────────────────────────────────

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
  return { success: true, message: "Bildirim tercihleri g\u00fcncellendi." };
}

// ── Consent Preferences ───────────────────────────────────────────

export async function grantConsent(
  category: ConsentCategory
): Promise<PreferencesFormState> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const now = new Date();
  const CONSENT_VERSION = "2026-05";

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

  await db.consentAuditLog.create({
    data: {
      userId: user.id,
      category,
      action: ConsentAction.GRANTED,
      version: CONSENT_VERSION,
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
  const CONSENT_VERSION = "2026-05";

  const updateData: Record<string, unknown> = {};
  if (category === ConsentCategory.PERSONALIZATION) {
    updateData.personalizationRevokedAt = now;
    // Clear cached affinity on revocation
    updateData.preferredCategoryIds = null;
    updateData.preferredStyleTagIds = null;
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

  await db.consentAuditLog.create({
    data: {
      userId: user.id,
      category,
      action: ConsentAction.REVOKED,
      version: CONSENT_VERSION,
    },
  });

  revalidatePath("/account/settings");
  return { success: true };
}

// ── Get preferences (for server components) ───────────────────────

export async function getMyPreferences() {
  const user = await getCurrentUser();
  if (!user) return null;
  return getUserPreferences(user.id);
}
