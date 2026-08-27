import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWhatsAppWebhookEnvelope } from "./account-update-parser";

test("extracts wabaId and owner_business_id directly under value (confirmed shape variant)", () => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "waba-from-entry",
        time: 1700000000,
        changes: [
          {
            field: "account_update",
            value: { event: "PARTNER_ADDED", waba_id: "waba-123", owner_business_id: "biz-456" },
          },
        ],
      },
    ],
  };

  const result = parseWhatsAppWebhookEnvelope(payload);
  assert.ok(result);
  assert.deepEqual(result!.partnerAdded, [{ wabaId: "waba-123", ownerBusinessId: "biz-456" }]);
});

test("extracts owner_business_id nested under waba_info (alternate documented shape)", () => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "waba-from-entry",
        changes: [
          {
            field: "account_update",
            value: { event: "PARTNER_ADDED", waba_info: { waba_id: "waba-nested", owner_business_id: "biz-nested" } },
          },
        ],
      },
    ],
  };

  const result = parseWhatsAppWebhookEnvelope(payload);
  assert.deepEqual(result!.partnerAdded, [{ wabaId: "waba-nested", ownerBusinessId: "biz-nested" }]);
});

test("falls back to entry.id for the WABA ID when value omits waba_id (confirmed field for this webhook type)", () => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "waba-from-entry-only",
        changes: [{ field: "account_update", value: { event: "PARTNER_ADDED" } }],
      },
    ],
  };

  const result = parseWhatsAppWebhookEnvelope(payload);
  assert.deepEqual(result!.partnerAdded, [{ wabaId: "waba-from-entry-only", ownerBusinessId: null }]);
});

test("ignores account_update events other than PARTNER_ADDED, without crashing", () => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "waba-1",
        changes: [{ field: "account_update", value: { event: "PARTNER_REMOVED" } }],
      },
    ],
  };

  const result = parseWhatsAppWebhookEnvelope(payload);
  assert.deepEqual(result!.partnerAdded, []);
  assert.deepEqual(result!.ignoredAccountUpdateEvents, ["PARTNER_REMOVED"]);
});

test("ignores unsupported webhook fields (messages, smb_message_echoes, smb_app_state_sync) without crashing", () => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "waba-1",
        changes: [
          { field: "messages", value: { some: "future shape" } },
          { field: "smb_message_echoes", value: {} },
          { field: "smb_app_state_sync", value: {} },
          { field: "account_update", value: { event: "PARTNER_ADDED", waba_id: "waba-1", owner_business_id: "biz-1" } },
        ],
      },
    ],
  };

  const result = parseWhatsAppWebhookEnvelope(payload);
  assert.deepEqual(result!.partnerAdded, [{ wabaId: "waba-1", ownerBusinessId: "biz-1" }]);
  assert.deepEqual(result!.ignoredFields.sort(), ["messages", "smb_app_state_sync", "smb_message_echoes"]);
});

test("handles multiple entries/changes in one batched payload", () => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      { id: "waba-a", changes: [{ field: "account_update", value: { event: "PARTNER_ADDED", waba_id: "waba-a", owner_business_id: "biz-a" } }] },
      { id: "waba-b", changes: [{ field: "account_update", value: { event: "PARTNER_ADDED", waba_id: "waba-b", owner_business_id: "biz-b" } }] },
    ],
  };

  const result = parseWhatsAppWebhookEnvelope(payload);
  assert.deepEqual(result!.partnerAdded, [
    { wabaId: "waba-a", ownerBusinessId: "biz-a" },
    { wabaId: "waba-b", ownerBusinessId: "biz-b" },
  ]);
});

test("returns null for a payload with the wrong object type", () => {
  const result = parseWhatsAppWebhookEnvelope({ object: "page", entry: [] });
  assert.equal(result, null);
});

test("returns null for a structurally malformed payload (missing entry array)", () => {
  assert.equal(parseWhatsAppWebhookEnvelope({ object: "whatsapp_business_account" }), null);
  assert.equal(parseWhatsAppWebhookEnvelope(null), null);
  assert.equal(parseWhatsAppWebhookEnvelope("not an object"), null);
  assert.equal(parseWhatsAppWebhookEnvelope(42), null);
});

test("returns an empty (not null) result for a structurally valid envelope with no recognized events", () => {
  const payload = { object: "whatsapp_business_account", entry: [{ id: "waba-1", changes: [] }] };
  const result = parseWhatsAppWebhookEnvelope(payload);
  assert.deepEqual(result, { partnerAdded: [], ignoredFields: [], ignoredAccountUpdateEvents: [] });
});

test("skips a PARTNER_ADDED change with no usable WABA id at all (no value.waba_id and no entry.id)", () => {
  const payload = {
    object: "whatsapp_business_account",
    entry: [{ changes: [{ field: "account_update", value: { event: "PARTNER_ADDED" } }] }],
  };

  const result = parseWhatsAppWebhookEnvelope(payload);
  assert.deepEqual(result!.partnerAdded, []);
});
