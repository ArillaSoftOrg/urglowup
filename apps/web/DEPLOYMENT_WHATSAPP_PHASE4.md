# WhatsApp Marketing Phase 4 — Deployment Guide

**Status**: Ready for deployment once Meta approves marketing templates.

This guide covers switching from dry-run mode to live WhatsApp campaign sends after Meta approval.

---

## Pre-Deployment: Waiting for Meta Approval

### Current State
- ✅ WhatsApp marketing campaign infrastructure complete
- ✅ Dry-run mode enabled by default (`WHATSAPP_DRY_RUN=true`)
- ✅ All validation, consent checks, and error logging ready
- ⏳ Awaiting Meta-approved marketing template names

### What to Provide to Meta
1. **Template names** and **content** for each marketing template (e.g., "welcome_offer", "seasonal_promo")
2. **Language codes** for each template (e.g., "en", "tr")
3. **Parameter names** if using dynamic content (e.g., `{{name}}`, `{{discount_code}}`)

---

## Go-Live: Once Meta Approves Templates

### Step 1: Update Environment Variables

In your production deployment (GitHub Actions secrets, vercel env, or `.env.production`):

```bash
# 1. Set approved templates (JSON array format)
WHATSAPP_MARKETING_TEMPLATES='[
  {
    "name": "welcome_offer",
    "language": "en",
    "description": "Welcome offer for new opt-ins"
  },
  {
    "name": "seasonal_promo",
    "language": "en",
    "description": "Seasonal promotion template"
  },
  {
    "name": "seasonal_promo",
    "language": "tr",
    "description": "Seasonal promotion template (Turkish)"
  }
]'

# 2. Disable dry-run mode (CRITICAL: this enables live sends)
WHATSAPP_DRY_RUN=false

# 3. Verify existing credentials are set
WHATSAPP_PHONE_NUMBER_ID=<your-phone-id>
WHATSAPP_ACCESS_TOKEN=<your-access-token>
WHATSAPP_API_VERSION=<your-api-version>
```

### Step 2: Verify Configuration in Admin Panel

1. Navigate to **Admin → Campaigns → Create WhatsApp Campaign**
2. Observe the status banner — should show:
   - ✅ Green "WhatsApp marketing ready"
   - List of approved templates
   - No "DRY-RUN" warning

3. If still showing warnings:
   - Check env vars are propagated (redeploy if needed)
   - Verify JSON in `WHATSAPP_MARKETING_TEMPLATES` is valid
   - Ensure `WHATSAPP_DRY_RUN` is `false` (not `true`)

### Step 3: Staging Verification Checklist

**Run this checklist with a small test audience (5–10 opted-in users):**

- [ ] Create new WhatsApp campaign in admin UI
  - [ ] Channel: WhatsApp
  - [ ] Template: select an approved template from dropdown
  - [ ] Audience: filter to 5–10 users with active WhatsApp consent
  - [ ] Save as draft
  
- [ ] Snapshot audience
  - [ ] Button shows recipient count
  - [ ] Recipient count = expected count (e.g., 5–10)
  
- [ ] Send campaign
  - [ ] Status banner shows no warnings/dry-run notice
  - [ ] Send button is enabled (not disabled)
  - [ ] Click Send → Confirmation flow
  - [ ] Campaign status changes to SENDING → SENT
  
- [ ] Verify delivery
  - [ ] Check **Campaign Detail** page
    - [ ] Recipient count = sent count (not failed count)
    - [ ] Recipient list shows `SENT` status, not `FAILED`
    - [ ] `providerMessageId` populated (not empty)
  
- [ ] Verify receipt
  - [ ] Test user(s) received WhatsApp messages
  - [ ] Message content matches template
  - [ ] Template parameters interpolated correctly (if used)
  
- [ ] Error handling
  - [ ] Manually revoke consent for one test user (set `emailMarketing=false`)
  - [ ] Re-run campaign on updated audience
  - [ ] Verify skipped user shows `SKIPPED` status with "Consent revoked" error

### Step 4: Production Rollout

#### Safe rollout strategy:
1. Start with **small, known-good audiences** (e.g., 50–100 opted-in users)
2. Monitor **Campaign Detail** page for errors
3. Check **Admin Action Log** for send events
4. Gradually increase audience size (250 → 500 → 1,000 → full audience)

#### Monitor these metrics:
- **Sent count** vs. failed count
- **Error breakdown** (group by error message)
- **Per-recipient delivery status** (SENT vs. FAILED vs. SKIPPED)

---

## Rollback: Returning to Dry-Run

If issues occur:

```bash
# Set dry-run back to true
WHATSAPP_DRY_RUN=true

# Redeploy
# This disables live sends immediately; pending campaigns stay in SENDING state
# No data loss; can re-enable once issues are resolved
```

---

## Reference: Environment Variable Changes

| Variable | Dry-Run (Phase 4 Pre-Approval) | Live (After Meta Approval) |
|---|---|---|
| `WHATSAPP_DRY_RUN` | `true` (default) | `false` |
| `WHATSAPP_MARKETING_TEMPLATES` | Empty string `""` | JSON array of approved templates |
| Admin UI Send Button | **Disabled** with warning | **Enabled** |
| Campaign Sends | Log to console, don't call Meta API | Call Meta API, update recipient status |

---

## Troubleshooting

### "No WhatsApp marketing templates configured"
- [ ] Check `WHATSAPP_MARKETING_TEMPLATES` env var is set
- [ ] Verify JSON is valid (use JSON validator)
- [ ] Redeploy to propagate env changes
- [ ] Refresh admin page to reload config

### "Template X is not approved for marketing"
- [ ] Verify template name in campaign matches `WHATSAPP_MARKETING_TEMPLATES`
- [ ] Check for typos (case-sensitive)
- [ ] Ensure template is in approved list before creating campaign

### "Consent revoked or not opted in"
- [ ] User has `whatsappMarketing=false` in `UserPreferences`
- [ ] Verify user consent timestamp is recent (`marketingConsentAt IS NOT NULL AND marketingRevokedAt IS NULL`)
- [ ] Create new campaign with broader audience filter to test

### Sends showing `FAILED` status
- [ ] Check **Campaign Detail** → **Recipient List** → **Error Message**
- [ ] Common errors:
  - `Invalid phone number format` → User phone not normalized (unlikely; should be filtered at audience level)
  - `Consent revoked` → User revoked consent after audience snapshot
  - Meta API errors → Check `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`

### Still in "dry-run" mode after deploying `WHATSAPP_DRY_RUN=false`
- [ ] Env var may not have propagated (redeploy again)
- [ ] Check deployment logs to confirm env var is set
- [ ] Restart server process if running locally

---

## After Go-Live: Ongoing Monitoring

1. **Weekly campaign audit**:
   - Check **Admin → Campaigns** for delivery rates
   - Review error breakdown for trends
   - Flag any templates with high failure rate to Meta support

2. **Consent compliance**:
   - Monitor **Unsubscribe** endpoint hits (should be low)
   - Track **revoked consent** events in `ConsentAuditLog`
   - Ensure never sending to revoked users (audit happens at send time)

3. **Performance**:
   - Monitor campaign send duration (should complete within 5 min for < 2,000 recipients)
   - If slowdown observed, Phase 5 queue system recommended

---

## Next Steps: Phase 5

Once Phase 4 is stable (weeks 1–2 of go-live):

- [ ] Implement Inngest or cron-based queue for audiences > 2,000
- [ ] Add Resend webhook for bounce/complaint suppression
- [ ] Add scheduled campaign feature (send at specific time)
- [ ] Implement suppression list (auto-unsubscribe bounced/invalid numbers)

---

## Contacts

- **Meta Support**: For template pre-approval, API limits, or delivery issues
- **Admin**: For env var updates, template additions, or rollback decisions
