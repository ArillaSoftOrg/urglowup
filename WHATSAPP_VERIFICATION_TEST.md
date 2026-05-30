# WhatsApp Marketing Verification Test Plan

**Status**: Pre-go-live verification  
**Test Date**: 2026-05-29  
**Mode**: DRY-RUN (safe, no actual Meta API calls)

---

## Test Objective

Verify all 13 safety properties of WhatsApp marketing implementation before enabling live sends.

---

## Test Setup

### Environment Configuration (Dry-Run Safe Mode)

```bash
# .env (or deployment env vars)

# Safe defaults — no real sends
WHATSAPP_DRY_RUN=true
WHATSAPP_MARKETING_TEMPLATES=""  # Empty = no sends

# Transactional credentials (existing, for booking_confirmed only)
WHATSAPP_PHONE_NUMBER_ID=<existing>
WHATSAPP_ACCESS_TOKEN=<existing>
WHATSAPP_API_VERSION=v21.0
WHATSAPP_NOTIFICATIONS_ENABLED=true
```

### Test Audience Setup

Create 2–3 test users with WhatsApp marketing consent:

```sql
-- User 1: Active consent, valid phone
UPDATE "UserPreferences" 
SET "marketingConsentAt" = NOW(), "marketingRevokedAt" = NULL, "whatsappMarketing" = true
WHERE "userId" = '<test-user-1-id>';

-- User 2: Revoked consent (for revocation test)
UPDATE "UserPreferences"
SET "marketingConsentAt" = NOW(), "marketingRevokedAt" = NOW(), "whatsappMarketing" = false
WHERE "userId" = '<test-user-2-id>';

-- User 3: No phone number (for invalid phone test)
UPDATE "User" SET "phone" = NULL WHERE id = '<test-user-3-id>';
```

---

## Test Cases

### Test 1: WHATSAPP_DRY_RUN defaults to true when unset

**Setup**: Unset WHATSAPP_DRY_RUN env var (or set to empty string)  
**Expected**: isDryRun = true (safe mode)  
**Verification**:
- [ ] Create a WhatsApp campaign
- [ ] Click Send
- [ ] Check logs: `[whatsapp-marketing] DRY RUN payload:` appears
- [ ] No fetch() to graph.facebook.com in logs
- [ ] Message ID returned is `dry-run-<timestamp>`

---

### Test 2: Empty WHATSAPP_MARKETING_TEMPLATES disables real sends

**Setup**: WHATSAPP_MARKETING_TEMPLATES=""  
**Expected**: Campaign send fails with "No WhatsApp marketing templates approved"  
**Verification**:
- [ ] Create WhatsApp campaign
- [ ] Try to send
- [ ] Admin UI shows red warning: "No WhatsApp marketing templates configured"
- [ ] Send button shows error message
- [ ] Error logged in AdminAction table

---

### Test 3: Invalid/malformed JSON fails safely

**Setup**: WHATSAPP_MARKETING_TEMPLATES='{"invalid": json'  
**Expected**: Gracefully defaults to no templates (safe)  
**Verification**:
- [ ] Check app logs: error logged "Failed to parse WHATSAPP_MARKETING_TEMPLATES"
- [ ] Campaign send fails (no templates approved)
- [ ] App does not crash

---

### Test 4: Only approved templates can be sent

**Setup**:
```
WHATSAPP_MARKETING_TEMPLATES='[
  {"name":"welcome_offer","language":"en"}
]'
```
Campaign templateName = "nonexistent_template"

**Expected**: Send fails with "not approved for marketing"  
**Verification**:
- [ ] Try to send campaign with unapproved template name
- [ ] Error: "Template \"nonexistent_template\" is not approved"
- [ ] Campaign remains in READY status (not SENDING)

---

### Test 5: Template language must match configured

**Setup**:
```
WHATSAPP_MARKETING_TEMPLATES='[
  {"name":"welcome_offer","language":"en"}
]'
```
Campaign templateParams.language = "tr"

**Expected**: Send fails with language mismatch error  
**Verification**:
- [ ] Try to send with mismatched language
- [ ] Error: "language mismatch. Configured: en, Campaign: tr"
- [ ] Campaign remains in READY status

---

### Test 6: Re-validate consent at dispatch time

**Setup**: User 2 (revoked consent)  
**Expected**: User 2 is skipped during send  
**Verification**:
- [ ] Create campaign targeting Users 1 & 2
- [ ] Snapshot audience (recipients count = 2)
- [ ] Send campaign
- [ ] Check Campaign Detail page:
  - [ ] User 1 status = SENT (or SKIPPED for dry-run)
  - [ ] User 2 status = FAILED with "Consent revoked or not opted in"

---

### Test 7: Revoked consent users not sent (already covered by Test 6)

**Verification**:
- [ ] Recipient list shows User 2 as FAILED/SKIPPED, not SENT

---

### Test 8: Invalid phone numbers become FAILED with error

**Setup**: User 3 (no phone)  
**Expected**: User 3 skipped with error "No phone number"  
**Verification**:
- [ ] Create campaign targeting User 3
- [ ] Send
- [ ] Check Campaign Detail:
  - [ ] User 3 status = FAILED
  - [ ] errorMessage = "No phone number"

**Additional test**: Set phone to invalid format (e.g., "abc123")  
**Expected**: "Invalid phone number format" error

---

### Test 9: Dry-run produces no Meta API call

**Setup**: WHATSAPP_DRY_RUN=true  
**Expected**: No HTTP POST to graph.facebook.com  
**Verification**:
- [ ] Create & send campaign with User 1
- [ ] Check application logs for:
  - [ ] `[whatsapp-marketing] DRY RUN payload:` present
  - [ ] `graph.facebook.com` fetch NOT called
  - [ ] Return value is `dry-run-<timestamp>`
- [ ] Check recipient status = SENT (dry-run success)

---

### Test 10: Live mode requires credentials

**Setup**: WHATSAPP_DRY_RUN=false + WHATSAPP_PHONE_NUMBER_ID unset  
**Expected**: Error thrown before any send  
**Verification**:
- [ ] Try to send
- [ ] Error: "Missing required env vars: WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN must be set"
- [ ] Campaign remains in READY status

---

### Test 11: Duplicate sends prevented

**Setup**: Campaign C1 with User 1, already snapshot  
**Expected**: Cannot insert duplicate (campaignId, userId) pair  
**Verification**:
- [ ] Create campaign C1, snapshot audience (User 1 recipient created)
- [ ] Try to snapshot again
- [ ] Database rejects duplicate (unique constraint violation)
- [ ] Admin shown error: "recipient already exists" or similar

---

### Test 12: Admin UI disables send when config missing/dry-run

**Setup 1**: WHATSAPP_MARKETING_TEMPLATES=""  
**Expected**: Send button shows disabled state with warning  
**Verification**:
- [ ] Go to Campaign Detail for READY WhatsApp campaign
- [ ] See red warning: "No WhatsApp marketing templates configured"
- [ ] Send button is disabled/grayed out

**Setup 2**: WHATSAPP_DRY_RUN=true (default)  
**Expected**: Send button enabled (dry-run is allowed) but shows amber warning  
**Verification**:
- [ ] With templates configured, see amber warning: "WhatsApp marketing in DRY-RUN mode"
- [ ] Send button is enabled
- [ ] Actual send produces no Meta API call (Test 9)

---

### Test 13: Deployment docs complete

**Verification**:
- [ ] DEPLOYMENT_WHATSAPP_PHASE4.md exists
- [ ] Contains env var examples with WHATSAPP_MARKETING_TEMPLATES JSON format
- [ ] Contains rollback steps (set WHATSAPP_DRY_RUN=true)
- [ ] Contains staging checklist (5–10 user test send, verify receipt, test consent revocation)
- [ ] Contains go-live sequence (env update → redeploy → verify → rollout)

---

## Dry-Run Integration Test

**Scenario**: End-to-end test with 2 users in dry-run mode

### Setup
```
WHATSAPP_DRY_RUN=true
WHATSAPP_MARKETING_TEMPLATES='[
  {"name":"test_template","language":"en"}
]'
```

Users:
- User A: consent active, phone = "+905551234567"
- User B: consent revoked, phone = "+905559876543"

### Steps
1. Create WhatsApp campaign "DryRun Test"
   - [ ] Channel: WhatsApp
   - [ ] Template: test_template
   - [ ] Audience: Both users
   - [ ] Save as draft

2. Snapshot audience
   - [ ] Admin clicks "Snapshot Audience"
   - [ ] Recipient count shown = 2
   - [ ] CampaignRecipient rows created (campaignId, userId)

3. Send campaign
   - [ ] Admin clicks "Send Campaign Now"
   - [ ] Confirmation dialog shown
   - [ ] Click "Confirm"
   - [ ] Campaign status changes to SENDING

4. Monitor send
   - [ ] Campaign status → SENT (or PARTIAL_FAILURE if User B's revocation matched)
   - [ ] Check logs:
     ```
     [whatsapp-marketing] DRY RUN payload: { ... template: "test_template", ... }
     [whatsapp-marketing] DRY RUN payload: { ... (User B consent check returned error) }
     ```

5. Verify Campaign Detail
   - [ ] User A: status = SENT, messageId = "dry-run-<timestamp>"
   - [ ] User B: status = FAILED, errorMessage = "Consent revoked or not opted in"
   - [ ] Summary card shows: "Sent to 1, 1 failed"
   - [ ] No error in Admin UI

6. Check AdminAction log
   - [ ] Entry logged: "campaign.send_whatsapp, Sent to 1 recipients, 1 failed. [DRY_RUN]"

---

## Success Criteria

✅ **All 13 property checks passed**  
✅ **TypeScript type check: no errors**  
✅ **Build: successful**  
✅ **Dry-run integration test: successful**  
✅ **No Meta API calls made (DRY_RUN=true)**  
✅ **Deployment docs complete and accurate**  

---

## Go-Live Prerequisites Checklist

Before setting `WHATSAPP_DRY_RUN=false`:

- [ ] Meta has approved at least one marketing template
- [ ] Template name and language documented
- [ ] WHATSAPP_MARKETING_TEMPLATES env var prepared (JSON array)
- [ ] WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN verified as valid
- [ ] All 13 safety tests passed
- [ ] Dry-run integration test passed
- [ ] Staging verification checklist (from DEPLOYMENT_WHATSAPP_PHASE4.md) ready to run
- [ ] Team trained on rollback steps (revert WHATSAPP_DRY_RUN=true)
- [ ] On-call rotation notified of live send window

---

## Remaining Blockers Before WHATSAPP_DRY_RUN=false

1. **Meta template approval**: Must receive approved template name, language, and parameter structure
2. **WHATSAPP_MARKETING_TEMPLATES env var**: Must be set in production deployment
3. **All safety tests passing**: No exceptions
4. **Staging checklist completed**: 5–10 user test send with real phones (optional for initial go-live, required before production rollout)

