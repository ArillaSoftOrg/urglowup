# Email Troubleshooting Quick Reference

**For support / ops teams diagnosing email issues.**

---

## User Reports "Didn't Receive Verification Email"

### Step 1: Verify Health (30 seconds)
```bash
curl "https://urglowup.vercel.app/api/health/email?secret=YOUR_SECRET"
```
- If status is NOT `"ok"`, configuration is broken — see "Configuration Errors" below
- If status IS `"ok"`, continue to Step 2

### Step 2: Check Server Logs (1 minute)
Look for this user's email with `[email:send_*]` prefix:

**Good signs:**
```
[email:send_success] {...,"to":"us***@example.com",...,"resendMessageId":"..."}
```
→ Email was sent by Resend. User should check spam folder.

**Bad signs:**
```
[email:send_failure] {...,"errorType":"RESEND_API_ERROR",...}
[auth:verification-email-failed] {...,"errorType":"MISSING_ENV",...}
```
→ Resend couldn't send it. Check Step 3.

### Step 3: Check Resend Dashboard
1. Log into https://resend.com/emails
2. Search for the email address or look at recent logs
3. Click on the attempt to see the error

**Possible failures:**
- **"Invalid API key"** → RESEND_API_KEY is wrong or expired. Generate new one and redeploy.
- **"Forbidden, invalid from address"** → EMAIL_FROM domain not verified. Add domain to Resend and redeploy.
- **"Rate limit exceeded"** → Too many emails sent. Wait a few minutes.
- **Not in logs at all** → Our system didn't even try to send. Check server logs again.

### Step 4: Check User's Email
1. Ask user to check spam/junk folder
2. Ask user to whitelist `noreply@*` from your domain
3. If still not there after 5 minutes, it's a delivery issue (not our code)

**If email isn't in Resend logs:**
- Configuration problem — run Step 1 again
- Or ask user to try "Resend Email" button and check logs again

---

## Configuration Errors

### Health Check Shows Error: "RESEND_API_KEY is not configured"

**Root cause:** Environment variable missing or empty

**Fix:**
1. Access deployment environment variables (Vercel / AWS / etc.)
2. Add or update:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```
3. Redeploy
4. Verify with health check

**Where to get API key:**
- Log in to https://resend.com/api-keys
- Copy a key (should start with `re_`)

---

### Health Check Shows Error: "EMAIL_FROM is not configured"

**Root cause:** EMAIL_FROM missing or invalid format

**Fix:**
1. Access environment variables
2. Add or update with proper format:
   ```
   EMAIL_FROM="UrGlowUp <noreply@yourdomain.com>"
   ```
   OR
   ```
   EMAIL_FROM="noreply@yourdomain.com"
   ```
3. Redeploy
4. Verify with health check

**For production:** Domain (`yourdomain.com`) must be verified in Resend dashboard

---

### Health Check Shows Warning: "uses Resend sandbox domain"

**Context:** Normal for development, not OK for production

**Fix:**
1. Add your domain to Resend: https://resend.com/docs/dashboard/domains/add-domain
2. Update EMAIL_FROM to use your domain:
   ```
   EMAIL_FROM="UrGlowUp <noreply@yourdomain.com>"
   ```
3. Redeploy
4. Check health endpoint again

---

## User Reports "Verification Link Doesn't Work"

### Link URL looks broken (no token)
```
❌ https://urglowup.vercel.app/verify-email
✓ https://urglowup.vercel.app/verify-email?token=abc123...
```

**Root cause:** Better Auth didn't generate token properly

**Fix:**
1. Check database — is there a `Verification` record for this user?
2. Ask user to request new verification email ("Tekrar Gönder" button)
3. If still broken, contact dev team

### Link works but says "Link has expired"

**Root cause:** Verification token older than 24 hours

**Fix:**
1. User should click "Doğrulama E-postasını Tekrar Gönder" button
2. Verify new email arrives (check steps above)
3. Click new link

---

## Email Arrives But Has Formatting Issues

**Issue:** Email looks broken, ugly, or missing images

**Cause:** Email client or Cloudinary domain not loading

**Fix:**
- Not our problem — email content is valid. User should whitelist sender.
- If images don't load, check that Cloudinary is not blocked by email provider

---

## Monitoring & Alerting

### Set Up Alert: Email Send Failures

Monitor logs for pattern:
```
[email:send_failure]
[auth:verification-email-failed]
[auth:password-reset-email-failed]
```

**Alert if:**
- More than 5% of signup attempts have email failures in 1 hour
- Any `[auth:*-email-failed]` with `errorType:"MISSING_ENV"` (config problem)
- Health endpoint returns status `"misconfigured"`

### Daily Check (Part of Status Handoff)

Run this command:
```bash
curl "https://urglowup.vercel.app/api/health/email?secret=YOUR_SECRET"
```

Should always show:
```json
{
  "status": "ok",
  "isConfigured": true,
  "errorCount": 0,
  "warningCount": 0
}
```

If not, investigate immediately.

---

## Common Myths

### "If health check says OK, email will definitely arrive"

**FALSE.** Health check validates config. Resend could still reject the email for:
- Domain reputation (new domain)
- Recipient spam filters
- Rate limits

### "Email send failures are always a bug in our code"

**FALSE.** Usually external:
- Resend API down/slow
- Bad configuration (most common)
- Recipient email bounced
- Spam filter block

### "We should throw an error if email fails"

**FALSE.** That breaks signup entirely. Better to:
- Create account anyway
- Log failure
- Let user retry with "Resend" button

---

## When to Escalate

Contact the dev team if:

1. Health check shows `status: "misconfigured"` and you can't find the fix above
2. Logs show `[email:send_failure]` for >50% of attempts
3. Resend dashboard shows emails in logs but user never receives them (delivery issue)
4. Better Auth throwing errors in logs (not just email send failures)
5. You suspect a bug in the email sending code (not config issue)

**Include in escalation:**
- Health check response
- Sample logs with `[email:*]` lines
- Resend dashboard screenshot (if applicable)
- Steps you already took

---

## Quick Checklist: "Email Isn't Working"

- [ ] Health check returns `status: ok`? (if not, fix config)
- [ ] Server logs show `[email:send_attempt]`? (if not, code isn't trying)
- [ ] Server logs show `[email:send_success]`? (if not, check Step 3)
- [ ] Resend dashboard shows the email? (if not, Resend rejected it)
- [ ] Email in user's inbox? (if not, spam filter or provider issue)
- [ ] Email in spam folder? (common — ask user to whitelist)
- [ ] Resend dashboard shows error code? (see "Configuration Errors")

If all checks pass but email still missing → Likely user's email provider issue, not ours.
