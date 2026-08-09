import type { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { updatePreferencesSchema } from "@urglowup/validation";
import { getUserPreferences, updateNotificationPreferences } from "@urglowup/domain/accounts";

function toPreferencesDTO(prefs: Awaited<ReturnType<typeof getUserPreferences>>) {
  return {
    locale: prefs.locale,
    theme: prefs.theme,
    consentVersion: prefs.consentVersion,
    personalizationConsentAt: prefs.personalizationConsentAt,
    personalizationRevokedAt: prefs.personalizationRevokedAt,
    analyticsConsentAt: prefs.analyticsConsentAt,
    analyticsRevokedAt: prefs.analyticsRevokedAt,
    marketingConsentAt: prefs.marketingConsentAt,
    marketingRevokedAt: prefs.marketingRevokedAt,
    emailTransactional: prefs.emailTransactional,
    whatsappTransactional: prefs.whatsappTransactional,
    emailMarketing: prefs.emailMarketing,
    whatsappMarketing: prefs.whatsappMarketing,
  };
}

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const prefs = await getUserPreferences(auth.user.id);
  return apiOk(toPreferencesDTO(prefs));
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const limited = await enforceApiRateLimit({
    scope: "account-preferences",
    subjectId: auth.user.id,
    ipLimit: 30,
    subjectLimit: 20,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Request body must be JSON.");
  }

  const parsed = updatePreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid preferences payload.");
  }

  const current = await getUserPreferences(auth.user.id);

  await updateNotificationPreferences(auth.user.id, {
    emailTransactional: parsed.data.emailTransactional ?? current.emailTransactional,
    whatsappTransactional: parsed.data.whatsappTransactional ?? current.whatsappTransactional,
    emailMarketingRequested: parsed.data.emailMarketing ?? current.emailMarketing,
    whatsappMarketingRequested: parsed.data.whatsappMarketing ?? current.whatsappMarketing,
  });

  const updated = await getUserPreferences(auth.user.id);
  return apiOk(toPreferencesDTO(updated));
}
