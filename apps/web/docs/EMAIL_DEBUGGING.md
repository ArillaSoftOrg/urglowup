# Email Delivery Debugging Guide

This guide helps diagnose why verification, password reset, and other auth emails may not be arriving.

## Quick Diagnostic Checklist

### 1. Check Email Configuration

Visit the health check endpoint in your browser or terminal:

```bash
# Local development
curl "http://localhost:3000/api/health/email?secret=YOUR_INTERNAL_API_SECRET"

# Production (requires INTERNAL_API_SECRET)
curl "https://urglowup.vercel.app/api/health/email?secret=YOUR_INTERNAL_API_SECRET"
```

Look for errors and warnings in the response. Common issues:

- **"RESEND_API_KEY is not configured"** → Add `RESEND_API_KEY` to `.env.local`
- **"EMAIL_FROM is not configured"** → Add `EMAIL_FROM` to `.env.local` (format: `Name <email@domain.com>` or `email@domain.com`)
- **"EMAIL_FROM uses Resend sandbox domain"** → OK for development, but production needs a verified custom domain

### 2. Check Server Logs

Look for email-related log lines when users sign up or trigger password reset:

**Success logs:**
```
[email:send_attempt] {"type":"send_attempt","to":"us***@example.com","subject":"UrGlowUp hesabini dogrula","template":"email-verification","timestamp":"2026-05-28T..."}
[email:send_success] {"type":"send_success","to":"us***@example.com","subject":"UrGlowUp hesabini dogrula","template":"email-verification","resendMessageId":"...","timestamp":"2026-05-28T..."}
```

**Failure logs:**
```
[email:send_failure] {"type":"send_failure","to":"us***@example.com","subject":"UrGlowUp hesabini dogrula","template":"email-verification","errorType":"RESEND_API_ERROR","errorMessage":"...","timestamp":"2026-05-28T..."}
[auth:verification-email-failed] {"userId":"...","email":"us***@example.com","errorType":"MISSING_ENV","errorMessage":"RESEND_API_KEY is invalid or missing"}
```

**Email logs are redacted** — email addresses show only first few characters for privacy.

### 3. Check Resend Dashboard

1. Visit [https://resend.com/emails](https://resend.com/emails)
2. Check the **Logs** section to see which emails were attempted
3. Look for failed emails with error codes (e.g., "Invalid API key", "Missing from email header")
4. Check your **Verified Domains** — production emails must come from a verified domain

### 4. Check Better Auth Configuration

Verify these are set in `.env.local`:

```
BETTER_AUTH_SECRET=<strong-random-secret>
BETTER_AUTH_URL=http://localhost:3000  # (or your production URL)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # (or your production URL)
```

The verification/reset emails use callback URLs built from these. If they're wrong, the email links won't work.

---

## Common Issues & Solutions

### Issue: "Account created successfully" but no verification email arrives

**Diagnosis:**
1. Check server logs for `[email:send_failure]` lines
2. Run health check endpoint — check for errors
3. Check Resend dashboard — is the email in the logs?

**Solutions:**

- **RESEND_API_KEY is invalid or missing**
  - Generate a new API key at [https://resend.com/api-keys](https://resend.com/api-keys)
  - Add it to `.env.local`: `RESEND_API_KEY=re_...`
  - Restart the dev server

- **EMAIL_FROM is not a verified domain (production)**
  - Development: You can use the Resend sandbox (`onboarding@resend.dev`)
  - Production: You must verify your domain in Resend. See [Resend Docs: Adding a Domain](https://resend.com/docs/dashboard/domains/add-domain)
  - Then set `EMAIL_FROM="Your Name <noreply@your-domain.com>"`

- **RESEND_API_KEY is production key but EMAIL_FROM uses sandbox domain**
  - Either:
    - Use a verified custom domain in EMAIL_FROM, OR
    - Use Resend's sandbox API key (starts with `re_test_`)

- **Rate limit exceeded**
  - Check Resend plan — free tier has limits
  - You've sent too many emails too quickly
  - Wait a few minutes and try again

### Issue: Verification email arrives but link doesn't work

**Diagnosis:**
1. Click the link in the email — what error do you see?
2. Check the URL format — should include `?token=...`

**Solutions:**

- **"Link has expired"**
  - Verification tokens expire after 24 hours
  - Use "Resend Verification Email" to get a fresh token
  - Or trigger a new signup

- **"Invalid origin" or "Security validation failed"**
  - Check `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` match your actual domain
  - Make sure neither has a trailing slash
  - Both should be absolute URLs (http://localhost:3000 or https://example.com)

- **Email link doesn't have a token**
  - Check the email source — does the button have an `href` attribute?
  - This suggests Better Auth didn't receive the token properly
  - Check Better Auth database — is there a Verification record for this user?

### Issue: Password reset flow doesn't send email

Same diagnostics as verification email above. Also check:

- User actually exists in the database
- User email address is correct
- No rate limit on forgot-password requests (see `enforceVerificationEmailRateLimit`)

### Issue: Email was sent but landed in spam

This is usually not a UrGlowUp issue, but sender configuration:

1. **SPF record** — Add your Resend sending domain to your SPF record
2. **DKIM** — Resend handles this automatically once domain is verified
3. **Email content** — Avoid spam keywords in subject line (this app doesn't, but worth checking)
4. **Sender reputation** — New domains may be flagged. Let Resend handle warm-up.

See [Resend Docs: Domain Authentication](https://resend.com/docs/dashboard/domains/domain-authentication)

---

## How the Email Flow Works

```
1. User submits form (signup / forgot-password / resend-verification)
   ↓
2. Server action in src/app/(auth)/actions.ts validates input
   ↓
3. Calls Better Auth's signup/password-reset/sendVerificationEmail
   ↓
4. Better Auth generates email content and calls callback in src/lib/auth.ts
   ↓
5. Callback calls sendEmail() in src/lib/email.ts
   ↓
6. sendEmail() calls Resend API with email details
   ↓
7. Logs result (success or failure with diagnosis)
   ↓
8. Returns to user:
   - Success: "Check your email" message
   - Failure: Generic error (doesn't expose internals)
```

**Key: Email send failures do NOT block account/reset creation.** If the email fails to send, the account is still created or reset token generated. The user can use "Resend Verification Email" later. This ensures better UX and prevents cascading failures.

---

## Development Workflow

### Testing Email Locally

1. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_test_XXXXXXXX  # Use sandbox/test key
   EMAIL_FROM="Test <onboarding@resend.dev>"
   BETTER_AUTH_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Sign up a test account:
   - Use an email you control (or temp email like [Mailtrap](https://mailtrap.io), [Mailinator](https://mailinator.com))
   - Watch server logs for `[email:send_*]` lines
   - Check your email inbox/spam folder

4. Check health endpoint:
   ```bash
   curl http://localhost:3000/api/health/email
   ```

5. Verify the email arrived:
   - Did you see a `[email:send_success]` log?
   - Is the email in your mailbox?
   - Does the link in the email work?

### Debugging a Specific Email Send

Add temporary console logging in `src/lib/email.ts` to capture the full error object:

```typescript
if (!result.success) {
  console.log("[DEBUG:email-failure] Full error object:", error);
}
```

Then grep logs for `[DEBUG:email-failure]` and examine the structure.

---

## Production Monitoring

1. **Set up error alerting** — Use Sentry, DataDog, or similar to alert on `[email:send_failure]` logs
2. **Monitor Resend dashboard** — Watch for failed emails or domain issues
3. **Track via INTERNAL_API_SECRET** — Periodically hit `/api/health/email` to verify config
4. **User reports** — Monitor support for "didn't get email" complaints, especially after deploys

---

## Code Changes Summary

### New Files
- `src/lib/email-diagnostics.ts` — Validation and error diagnosis utilities
- `src/lib/email-bootstrap.ts` — Startup config validation
- `src/app/api/health/email/route.ts` — Health check endpoint

### Modified Files
- `src/lib/email.ts` — Enhanced with structured logging and diagnostics
- `src/lib/auth.ts` — Better Auth callbacks now log failures without breaking signup/reset
- `src/app/(auth)/actions.ts` — Improved user messages and error logging
- `src/app/layout.tsx` — Added email config bootstrap on startup

### Behavior Changes
- Failures to send auth emails no longer block account creation or reset flow
- Server logs now include structured email event tracking with `[email:*]` prefixes
- User-facing messages are slightly clearer about "request accepted" vs "email sent"
- Health check endpoint available for diagnostics (requires INTERNAL_API_SECRET)

---

## Support

If emails still aren't working after following this guide:

1. Collect logs with `[email:send_failure]` and `[auth:*-email-failed]`
2. Check Resend dashboard for the attempt
3. Verify Resend API key is valid (can generate a new one)
4. Verify domain is verified (for production)
5. File an issue with:
   - Error logs (redacted)
   - Environment (dev/prod)
   - Whether Resend shows the attempt in its dashboard
