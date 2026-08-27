/**
 * Parses Meta's WhatsApp Business Platform webhook envelope, extracting
 * account_update / PARTNER_ADDED events for the Coexistence onboarding
 * flow. Tolerates every other webhook field (messages, smb_message_echoes,
 * smb_app_state_sync, other account_update events) without throwing — this
 * phase only acts on PARTNER_ADDED; everything else is safely ignored so a
 * batched payload containing a mix of fields never fails the whole request.
 *
 * Confirmed against Meta's official account_update example (developers.facebook.com,
 * WhatsApp Business Accounts page — the ACCOUNT_VIOLATION example):
 *   { object, entry: [{ id, time, changes: [{ field, value: { event, ... } }] }] }
 * `entry[].id` is the WABA ID for this webhook type — confirmed by that
 * example. Meta's Postman collection (per Phase 1.2 instructions) further
 * documents PARTNER_ADDED's `value` as containing `waba_id` /
 * `owner_business_id`, but the exact nesting (directly under `value`, or
 * under a `value.waba_info` sub-object as some third-party integration
 * guides show) was NOT independently confirmed against an official example
 * during this phase — see the Phase 1.2 report's "Hala Belirsiz Olan Meta
 * Davranışları". This parser checks every plausible location rather than
 * committing to one guess, and always falls back to the confirmed
 * `entry[].id` for the WABA ID even if `value` omits it.
 *
 * This file is SERVER-ONLY, but has no side effects — pure parsing, safe to
 * unit test without env vars, DB, or network.
 */

export interface PartnerAddedEvent {
  wabaId: string;
  ownerBusinessId: string | null;
}

export interface ParsedWebhookEnvelope {
  partnerAdded: PartnerAddedEvent[];
  /** field names seen that this phase doesn't process — for safe, non-payload logging. */
  ignoredFields: string[];
  /** account_update events seen that aren't PARTNER_ADDED — for safe, non-payload logging. */
  ignoredAccountUpdateEvents: string[];
}

const KNOWN_FIELDS = new Set(["account_update"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Extracts owner_business_id from any of the plausible payload shapes —
 * see the module doc comment for why this isn't a single fixed path.
 */
function extractOwnerBusinessId(value: Record<string, unknown>): string | null {
  const direct = asString(value.owner_business_id);
  if (direct) return direct;

  const wabaInfo = asRecord(value.waba_info);
  if (wabaInfo) {
    const nested = asString(wabaInfo.owner_business_id);
    if (nested) return nested;
  }

  return null;
}

/**
 * Extracts waba_id from the change's `value`, falling back to the entry-level
 * `id` (the confirmed field for this webhook type) when `value` omits it.
 */
function extractWabaId(value: Record<string, unknown>, entryId: string | null): string | null {
  const direct = asString(value.waba_id);
  if (direct) return direct;

  const wabaInfo = asRecord(value.waba_info);
  if (wabaInfo) {
    const nested = asString(wabaInfo.waba_id);
    if (nested) return nested;
  }

  return entryId;
}

/**
 * Parses a raw, already-JSON.parsed webhook body. Returns null if the
 * top-level envelope doesn't match Meta's documented shape at all (not the
 * WhatsApp Business Account object, or malformed structurally) — the
 * caller should treat that as a request-level error, distinct from "valid
 * envelope, nothing we handle in it" (which returns an empty result, not null).
 */
export function parseWhatsAppWebhookEnvelope(payload: unknown): ParsedWebhookEnvelope | null {
  const root = asRecord(payload);
  if (!root || root.object !== "whatsapp_business_account") {
    return null;
  }

  const entries = Array.isArray(root.entry) ? root.entry : null;
  if (!entries) {
    return null;
  }

  const partnerAdded: PartnerAddedEvent[] = [];
  const ignoredFields: string[] = [];
  const ignoredAccountUpdateEvents: string[] = [];

  for (const rawEntry of entries) {
    const entry = asRecord(rawEntry);
    if (!entry) continue;

    const entryId = asString(entry.id);
    const changes = Array.isArray(entry.changes) ? entry.changes : [];

    for (const rawChange of changes) {
      const change = asRecord(rawChange);
      if (!change) continue;

      const field = asString(change.field);
      if (!field) continue;

      if (!KNOWN_FIELDS.has(field)) {
        ignoredFields.push(field);
        continue;
      }

      const value = asRecord(change.value);
      const event = value ? asString(value.event) : null;

      if (event !== "PARTNER_ADDED") {
        if (event) ignoredAccountUpdateEvents.push(event);
        continue;
      }

      if (!value) continue;

      const wabaId = extractWabaId(value, entryId);
      if (!wabaId) continue; // malformed PARTNER_ADDED event — nothing usable to act on

      partnerAdded.push({ wabaId, ownerBusinessId: extractOwnerBusinessId(value) });
    }
  }

  return { partnerAdded, ignoredFields, ignoredAccountUpdateEvents };
}
