/**
 * Persistence for the single centralized Urglowup WhatsApp integration
 * (WABA ID, Phone Number ID, encrypted access token) resulting from Meta
 * Embedded Signup / Coexistence onboarding.
 *
 * There is intentionally only ever one row — see WhatsAppIntegration's
 * `singletonKey` unique constraint in schema.prisma. This is NOT a
 * multi-tenant credential model; do not add a businessId/userId FK here.
 *
 * Reuses the same AES-256-GCM encryption already used for
 * BusinessExternalConnection's OAuth tokens (OAUTH_TOKEN_ENCRYPTION_KEY) —
 * see lib/external/google/encryption.ts. That module isn't actually
 * Google-specific (it's keyed off a generic env var and generic string
 * plaintext), so it's imported directly here rather than duplicated.
 *
 * Two independent onboarding paths write here (see discovery.ts's doc
 * comment for the same distinction):
 *   - recordWabaDiscovered / recordPhoneDiscovered / markConnected /
 *     markFailed — incremental, used by the Meta-hosted PARTNER_ADDED
 *     webhook flow (api/webhooks/whatsapp/route.ts). Never touches
 *     accessTokenEncrypted — that flow uses WHATSAPP_SYSTEM_USER_ACCESS_TOKEN
 *     (an env var), not a per-onboarding token.
 *   - saveWhatsAppIntegration — atomic, reserved for a future JS-SDK
 *     Embedded Signup flow that receives WABA ID + phone number ID + an
 *     exchangeable OAuth token together. Not called anywhere in this phase.
 *
 * This file is SERVER-ONLY. Never import in client components.
 */
import { db } from "@/lib/db";
import { encryptTokenWithEnvKey, decryptTokenWithEnvKey } from "@/lib/external/google/encryption";
import type { WhatsAppIntegrationStatus } from "@/generated/prisma/enums";

const SINGLETON_KEY = "primary";

// Only these two statuses represent "further along than a fresh
// PARTNER_ADDED redelivery should be allowed to reset" — see
// recordWabaDiscovered()'s doc comment.
const ADVANCED_STATUSES = new Set<WhatsAppIntegrationStatus>(["PHONE_DISCOVERED", "CONNECTED"]);

export interface WhatsAppIntegrationInput {
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber?: string;
  ownerBusinessId?: string;
  accessTokenPlaintext: string;
  tokenType?: string;
}

export interface WhatsAppIntegrationStatusRecord {
  status: WhatsAppIntegrationStatus;
  wabaId: string;
  ownerBusinessId: string | null;
  phoneNumberId: string | null;
  displayPhoneNumber: string | null;
  lastError: string | null;
  connectedAt: Date;
  updatedAt: Date;
}

const STATUS_SELECT = {
  status: true,
  wabaId: true,
  ownerBusinessId: true,
  phoneNumberId: true,
  displayPhoneNumber: true,
  lastError: true,
  connectedAt: true,
  updatedAt: true,
} as const;

/**
 * Reserved for the future JS-SDK Embedded Signup flow (not called anywhere
 * in this phase). Encrypts and upserts everything atomically. Sets status
 * to PHONE_DISCOVERED, not CONNECTED — that flow still needs its own
 * subscribeAppToWaba() call afterward for true CONNECTED, same as the
 * hosted flow.
 */
export async function saveWhatsAppIntegration(
  input: WhatsAppIntegrationInput,
): Promise<{ id: string; wabaId: string; phoneNumberId: string | null }> {
  const accessTokenEncrypted = encryptTokenWithEnvKey(input.accessTokenPlaintext);

  return db.whatsAppIntegration.upsert({
    where: { singletonKey: SINGLETON_KEY },
    create: {
      singletonKey: SINGLETON_KEY,
      status: "PHONE_DISCOVERED",
      wabaId: input.wabaId,
      ownerBusinessId: input.ownerBusinessId,
      phoneNumberId: input.phoneNumberId,
      displayPhoneNumber: input.displayPhoneNumber,
      accessTokenEncrypted,
      tokenType: input.tokenType,
      lastError: null,
    },
    update: {
      status: "PHONE_DISCOVERED",
      wabaId: input.wabaId,
      ownerBusinessId: input.ownerBusinessId,
      phoneNumberId: input.phoneNumberId,
      displayPhoneNumber: input.displayPhoneNumber,
      accessTokenEncrypted,
      tokenType: input.tokenType,
      lastError: null,
    },
    select: { id: true, wabaId: true, phoneNumberId: true },
  });
}

/**
 * First-write for the Meta-hosted PARTNER_ADDED webhook flow — persists the
 * WABA ID as soon as it's known, before any Graph API call is made. Safe to
 * call repeatedly (Meta may redeliver the same webhook): if the integration
 * has already progressed past WABA_DISCOVERED (i.e. PHONE_DISCOVERED or
 * CONNECTED), a redelivery updates the identifiers but does NOT downgrade
 * status or touch phone/token fields — a duplicate PARTNER_ADDED must never
 * erase further progress. A row previously marked FAILED IS reset back to
 * WABA_DISCOVERED (clearing lastError), since FAILED here means "the phone
 * discovery step failed," which a fresh PARTNER_ADDED redelivery is a
 * reasonable trigger to retry.
 */
export async function recordWabaDiscovered(input: {
  wabaId: string;
  ownerBusinessId: string | null;
}): Promise<void> {
  const existing = await db.whatsAppIntegration.findUnique({
    where: { singletonKey: SINGLETON_KEY },
    select: { status: true },
  });

  if (!existing) {
    await db.whatsAppIntegration.create({
      data: {
        singletonKey: SINGLETON_KEY,
        status: "WABA_DISCOVERED",
        wabaId: input.wabaId,
        ownerBusinessId: input.ownerBusinessId,
      },
    });
    return;
  }

  const shouldAdvanceStatus = !ADVANCED_STATUSES.has(existing.status);

  await db.whatsAppIntegration.update({
    where: { singletonKey: SINGLETON_KEY },
    data: {
      wabaId: input.wabaId,
      ownerBusinessId: input.ownerBusinessId,
      ...(shouldAdvanceStatus ? { status: "WABA_DISCOVERED", lastError: null } : {}),
    },
  });
}

/**
 * Records a successful phone-number match (see
 * discovery.ts's findExpectedWhatsAppPhoneNumber). Requires a row to
 * already exist (recordWabaDiscovered must have run first) — throws
 * Prisma's own "record not found" error otherwise, which should not be
 * reachable in practice given the webhook handler's call order.
 */
export async function recordPhoneDiscovered(input: {
  phoneNumberId: string;
  displayPhoneNumber: string;
}): Promise<void> {
  await db.whatsAppIntegration.update({
    where: { singletonKey: SINGLETON_KEY },
    data: {
      status: "PHONE_DISCOVERED",
      phoneNumberId: input.phoneNumberId,
      displayPhoneNumber: input.displayPhoneNumber,
      lastError: null,
    },
  });
}

/**
 * Marks the integration FAILED with a short, safe (non-payload,
 * non-secret) summary — e.g. "no phone number matched
 * WHATSAPP_EXPECTED_PHONE_NUMBER" or "ambiguous: 2 phone numbers matched".
 * Requires a row to already exist, same as recordPhoneDiscovered.
 */
export async function markFailed(reason: string): Promise<void> {
  await db.whatsAppIntegration.update({
    where: { singletonKey: SINGLETON_KEY },
    data: { status: "FAILED", lastError: reason },
  });
}

/**
 * Marks the integration CONNECTED — call only after subscribeAppToWaba()
 * (subscription.ts) has actually succeeded. Not called anywhere in this
 * phase; subscription is a manually/future-triggered step, not part of the
 * webhook POST handler yet.
 */
export async function markConnected(): Promise<void> {
  await db.whatsAppIntegration.update({
    where: { singletonKey: SINGLETON_KEY },
    data: { status: "CONNECTED", lastError: null },
  });
}

/**
 * Returns non-secret connection metadata only — never the encrypted token.
 * Safe to surface in a future admin UI (not built in this phase).
 */
export async function getWhatsAppIntegrationStatus(): Promise<WhatsAppIntegrationStatusRecord | null> {
  return db.whatsAppIntegration.findUnique({
    where: { singletonKey: SINGLETON_KEY },
    select: STATUS_SELECT,
  });
}

/**
 * Decrypts and returns the stored access token, if one was ever persisted
 * by the (not-yet-used) JS-SDK flow's saveWhatsAppIntegration(). Returns
 * null both when no row exists AND when a row exists but has no token
 * (the normal case for the Meta-hosted PARTNER_ADDED flow, which never
 * writes one — see the module doc comment). Not called anywhere yet.
 */
export async function getDecryptedWhatsAppAccessToken(): Promise<string | null> {
  const record = await db.whatsAppIntegration.findUnique({
    where: { singletonKey: SINGLETON_KEY },
    select: { accessTokenEncrypted: true },
  });

  if (!record?.accessTokenEncrypted) return null;
  return decryptTokenWithEnvKey(record.accessTokenEncrypted);
}
