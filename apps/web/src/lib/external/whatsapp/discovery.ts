/**
 * WABA / phone-number discovery helpers for WhatsApp Embedded Signup.
 *
 * This file holds TWO independent discovery paths for two different
 * onboarding mechanisms — do not conflate them:
 *
 *   1. discoverWabaId() — STANDARD EMBEDDED SIGNUP OAUTH DISCOVERY.
 *      For the (not built in this phase) JS-SDK FB.login() embedded flow,
 *      where we hold a customer-scoped OAuth user access token and must
 *      inspect its granted permissions to find the WABA ID. The
 *      Meta-hosted "Generate link" flow this app actually uses right now
 *      NEVER calls this — it gets the WABA ID directly from the
 *      account_update/PARTNER_ADDED webhook (see
 *      account-update-parser.ts), with no OAuth token involved at all.
 *
 *   2. findExpectedWhatsAppPhoneNumber() — used by BOTH mechanisms. Given a
 *      WABA ID and some access token, lists its registered phone numbers
 *      and matches by number, never by position — see its own doc comment.
 *
 * This file is SERVER-ONLY. Never import in client components.
 */
import type { WhatsAppOnboardingConfig } from "./onboarding-config";
import { normalizeTurkishPhone, maskPhoneForLogging } from "./phone";

export class WhatsAppDiscoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhatsAppDiscoveryError";
  }
}

interface DebugTokenResponse {
  data?: {
    is_valid?: boolean;
    granular_scopes?: Array<{ scope: string; target_ids?: string[] }>;
  };
}

/**
 * STANDARD EMBEDDED SIGNUP OAUTH DISCOVERY — not used by the Meta-hosted
 * PARTNER_ADDED webhook flow. Inspects a customer-scoped OAuth user access
 * token via Meta's /debug_token endpoint and returns the WABA ID granted
 * under the whatsapp_business_management permission's granular scope.
 * Reserved for a future JS-SDK Embedded Signup implementation.
 *
 * Uses an app access token (`{appId}|{appSecret}`) as the inspecting
 * token — Meta's standard pattern for /debug_token. Never logged.
 */
export async function discoverWabaId(
  config: WhatsAppOnboardingConfig,
  userAccessToken: string,
): Promise<string> {
  const appAccessToken = `${config.appId}|${config.appSecret}`;
  const params = new URLSearchParams({
    input_token: userAccessToken,
    access_token: appAccessToken,
  });

  const url = `https://graph.facebook.com/${config.apiVersion}/debug_token?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new WhatsAppDiscoveryError("WABA discovery network request failed");
  }

  if (!response.ok) {
    throw new WhatsAppDiscoveryError(`WABA discovery failed with status ${response.status}`);
  }

  let json: DebugTokenResponse;
  try {
    json = (await response.json()) as DebugTokenResponse;
  } catch {
    throw new WhatsAppDiscoveryError("WABA discovery response was not valid JSON");
  }

  const scope = json.data?.granular_scopes?.find((s) => s.scope === "whatsapp_business_management");
  const wabaId = scope?.target_ids?.[0];

  if (!wabaId) {
    throw new WhatsAppDiscoveryError(
      "No WABA ID found in the exchanged token's granted scopes — the Embedded Signup flow may not have completed correctly",
    );
  }

  return wabaId;
}

interface PhoneNumbersResponse {
  data?: Array<{ id: string; display_phone_number?: string; verified_name?: string }>;
}

export type PhoneNumberMatchResult =
  | { status: "matched"; phoneNumberId: string; displayPhoneNumber: string }
  | { status: "not_found" }
  | { status: "ambiguous"; matchCount: number };

/**
 * Lists the phone numbers registered under a WABA and matches by NUMBER
 * against the configured expectedPhoneNumber — never by position. Meta
 * does not document or guarantee any ordering for /phone_numbers, so
 * "the first result" is not a safe way to identify which number is
 * actually the Urglowup number (Phase 1.1/1.2 correction — Phase 1
 * originally picked data[0], which this replaces).
 *
 * Returns a discriminated result instead of throwing for the
 * zero-match/multiple-match cases: those are expected, recoverable
 * onboarding states (not transport/API failures), and the caller decides
 * how to record them (see integration-store.ts's markFailed()).
 *
 * @param apiVersion Graph API version — only field this function actually
 *   needs, so it takes it directly rather than a full WhatsAppOnboardingConfig
 *   (which also carries appId/appSecret/redirectUri, irrelevant here — this
 *   function is shared by both onboarding mechanisms, one of which has no
 *   OAuth app config at all).
 * @param expectedPhoneNumber Already-normalized E.164 (+90...) — see
 *   webhook-config.ts, which validates this at config-read time.
 */
export async function findExpectedWhatsAppPhoneNumber(
  apiVersion: string,
  wabaId: string,
  accessToken: string,
  expectedPhoneNumber: string,
): Promise<PhoneNumberMatchResult> {
  const params = new URLSearchParams({ access_token: accessToken });
  const url = `https://graph.facebook.com/${apiVersion}/${wabaId}/phone_numbers?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new WhatsAppDiscoveryError("Phone number discovery network request failed");
  }

  if (!response.ok) {
    throw new WhatsAppDiscoveryError(`Phone number discovery failed with status ${response.status}`);
  }

  let json: PhoneNumbersResponse;
  try {
    json = (await response.json()) as PhoneNumbersResponse;
  } catch {
    throw new WhatsAppDiscoveryError("Phone number discovery response was not valid JSON");
  }

  const numbers = json.data ?? [];

  const matches = numbers.filter((n) => {
    const normalized = normalizeTurkishPhone(n.display_phone_number);
    return normalized !== null && normalized === expectedPhoneNumber;
  });

  if (matches.length === 0) {
    console.warn(
      `[whatsapp/discovery] WABA ${wabaId}: no registered number matched the expected number (${maskPhoneForLogging(expectedPhoneNumber)}) among ${numbers.length} candidate(s)`,
    );
    return { status: "not_found" };
  }

  if (matches.length > 1) {
    console.warn(
      `[whatsapp/discovery] WABA ${wabaId}: ${matches.length} registered numbers matched the expected number — ambiguous, refusing to auto-select`,
    );
    return { status: "ambiguous", matchCount: matches.length };
  }

  const match = matches[0];
  return { status: "matched", phoneNumberId: match.id, displayPhoneNumber: match.display_phone_number ?? "" };
}
