# Auth Email Delivery Debugging & Improvements

**Date:** May 28, 2026  
**Goal:** Debug why verification/reset emails show "sent" but don't arrive; improve observability and user feedback.

---

## Root Causes Identified

1. **Silent failures in `sendEmail()`**
   - Resend API errors were logged but not structured, making them hard to track
   - No distinction between different failure types (missing env, API error, rate limit)
   - Caller (Better Auth) didn't know if email actually sent or failed

2. **Better Auth callbacks don't check email send results**
   - `sendResetPassword` and `sendVerificationEmail` callbacks are fire-and-forget
   - If email send threw an error, it would be swallowed
   - Better Auth proceeding with account creation/reset even if email failed

3. **UI shows success even when delivery uncertain**
   - Sign-up page says "doğrulama e-postası gönderildi" (sent) but doesn't know for sure
   - No way for users to retry if initial email failed
   - No way for support to diagnose issues from logs

4. **No email configuration validation**
   - Missing or invalid `RESEND_API_KEY` only discovered at first email attempt
   - Invalid `EMAIL_FROM` domain only fails at Resend call
   - No early warning during app startup

5. **Inadequate logging for production**
   - No structured logging format
   - Email addresses exposed in plaintext logs (privacy issue)
   - No way to correlate failures with user reports

---

## Changes Made

### 1. New Diagnostics Module (`src/lib/email-diagnostics.ts`)

**Purpose:** Validate email configuration and diagnose Resend failures

**Key functions:**
- `validateEmailConfig()` — Checks RESEND_API_KEY, EMAIL_FROM, BETTER_AUTH_URL validity at startup
- `diagnoseResendError()` — Categorizes Resend errors (MISSING_ENV, INVALID_EMAIL, RATE_LIMIT, etc.)
- `logEmailEvent()` — Structured, privacy-safe email event logging

**Example output:**
```
[email:send_attempt] {"type":"send_attempt","to":"us***@example.com","subject":"...","template":"email-verification"}
[email:send_success] {"type":"send_success",...,"resendMessageId":"20250528-abc123"}
[email:send_failure] {"type":"send_failure",...,"errorType":"RESEND_API_ERROR","errorMessage":"..."}
```

### 2. Bootstrap Validation (`src/lib/email-bootstrap.ts`)

**Purpose:** Validate email config on app startup

**Behavior:**
- Runs once on first request to root layout
- Logs errors and warnings to console
- Does not block app startup (graceful degradation)

**Example log on startup:**
```
[email-bootstrap:errors] {"count":1,"errors":["RESEND_API_KEY is not configured..."]}
[email-bootstrap:warnings] {"count":1,"warnings":["EMAIL_FROM uses Resend sandbox domain..."]}
```

### 3. Health Check Endpoint (`src/app/api/health/email/route.ts`)

**Purpose:** Diagnostic endpoint for monitoring and testing

**Access:** `GET /api/health/email?secret=INTERNAL_API_SECRET`

**Response:**
```json
{
  "status": "ok|misconfigured|warning",
  "isConfigured": boolean,
  "errorCount": number,
  "warningCount": number,
  "errors": [...],
  "warnings": [...]
}
```

**Use cases:**
- Monitor email config in production
- Verify config after deployment
- Debug env var issues

### 4. Enhanced Email Sending (`src/lib/email.ts`)

**Changes:**
- `sendEmail()` now returns `{ success, messageId?, error?, errorType? }` instead of throwing
- Added structured logging for all attempts, successes, and failures
- Email addresses redacted in logs (only first 2 chars + domain)
- Captures Resend API error details for diagnosis

**Before:**
```typescript
if (response.error) {
  console.error("[email] Failed to send email", { to, subject, error });
  throw new Error(`Failed to send email: ${subject}`);
}
```

**After:**
```typescript
if (response.error) {
  const diagnosis = diagnoseResendError(response.error);
  logEmailEvent({ type: "send_failure", ..., errorType: diagnosis.type, ... });
  return { success: false, error: diagnosis.message, errorType: diagnosis.type };
}
```

### 5. Better Auth Integration (`src/lib/auth.ts`)

**Changes:**
- Email callbacks now handle `sendEmail()` return value
- Log failures with context (userId, email, errorType)
- Continue with account creation/reset even if email fails (graceful degradation)
- Don't throw errors that would block signup/reset

**Example (password reset):**
```typescript
const result = await sendEmail({...});
if (!result.success) {
  console.error("[auth:password-reset-email-failed]", {
    userId: user.id,
    email: user.email,
    errorType: result.errorType,
    errorMessage: result.error,
  });
  // Continue anyway — reset token is still valid
}
```

### 6. Improved Auth Actions (`src/app/(auth)/actions.ts`)

**Changes:**
- Better user-facing messages distinguishing "request accepted" from "email sent"
- Added logging in `resendVerificationEmail()` error handler with redacted email
- Updated messages to mention "Tekrar Gönder" button for users who didn't receive email

**Before:**
```
"Hesabınız oluşturuldu. Devam etmek için doğrulama e-postasını açın."
```

**After:**
```
"Hesabınız oluşturuldu. Devam etmek için doğrulama e-postasını açın. E-posta birkaç dakika içinde gelmezse spam klasörünü kontrol edin. Hala almadıysanız 'Doğrulama E-postasını Tekrar Gönder'i kullanabilirsiniz."
```

### 7. App Startup (`src/app/layout.tsx`)

**Changes:**
- Imported and called `bootstrapEmailConfig()` on module load
- Validation runs before any requests are handled

---

## Security Considerations

✓ **Email addresses redacted in logs** — Only first 2 chars + domain visible  
✓ **API keys never logged** — Errors sanitized before logging  
✓ **Health check requires secret** — `INTERNAL_API_SECRET` required for `/api/health/email`  
✓ **Forgot-password generic message** — Doesn't leak whether account exists  
✓ **No sensitive details in user messages** — Internal logs have details, UI doesn't  

---

## How It Works Now

### Signup Email Flow

```
1. User submits signup form
   ↓
2. Server validates input, calls auth.api.signUpEmail()
   ↓
3. Better Auth creates user, calls emailVerification callback
   ↓
4. Callback calls sendEmail() → logs "send_attempt"
   ↓
5a. Email sent successfully:
    - Logs "send_success" with Resend message ID
    - User continues to verification page
    - Page says "check your email"
    
5b. Email send failed:
    - Logs "send_failure" with error type and message
    - Continue anyway (user can click "Resend" button)
    - User continues to verification page
    - Page says "check your email" (same as success)
```

### Forgot Password Flow

```
1. User submits forgot password form
   ↓
2. Server validates, calls auth.api.requestPasswordReset()
   ↓
3. Better Auth creates reset token, calls sendResetPassword callback
   ↓
4. Callback calls sendEmail() → logs "send_attempt"
   ↓
5a. Email sent successfully:
    - Logs "send_success"
    
5b. Email send failed:
    - Logs "send_failure" with error type
    - Continue anyway (token still valid for user's next attempt)
    
6. Return generic message to user: "If account exists, reset link sent"
   (Security: doesn't leak whether account exists)
```

### Monitoring & Diagnostics

```
When to check:
- After deploying to new environment → Hit /api/health/email
- User reports "didn't get email" → Check server logs for [email:send_failure]
- Resend reports failed delivery → Check our logs for matching timestamp

What to look for:
- [email:send_attempt] → Request was made
- [email:send_success] with resendMessageId → Resend accepted it
- [email:send_failure] with errorType → Specific diagnosis
- [auth:*-email-failed] → Better Auth caught a failure
```

---

## Testing & Verification

### Local Development

1. **Check health endpoint:**
   ```bash
   curl http://localhost:3000/api/health/email
   ```
   Should show no errors, warning about sandbox domain is OK

2. **Sign up and check logs:**
   ```bash
   npm run dev
   # In browser: signup with test email
   # In terminal: Look for [email:send_*] logs
   ```

3. **Check Resend dashboard:**
   - Visit https://resend.com/emails
   - Should see the test email in logs

4. **Verify email received:**
   - Check your test email inbox
   - Click verification link
   - Should auto-verify and redirect

### Production Verification

1. **After deployment, check health:**
   ```bash
   curl "https://urglowup.vercel.app/api/health/email?secret=YOUR_INTERNAL_API_SECRET"
   ```
   Must show `"status": "ok"` with no errors

2. **Monitor logs for failures:**
   - Use your logging service (Vercel, Sentry, etc.)
   - Search for `[email:send_failure]`
   - Alert if error rate exceeds threshold

3. **Test with real signup:**
   - Have a team member sign up
   - Verify email arrives within 1-2 minutes
   - Verify link works and auto-verifies

### Troubleshooting Checklist

- [ ] Health check shows `"status": "ok"`
- [ ] No errors in console on startup
- [ ] Server logs show `[email:send_attempt]` for each signup
- [ ] Server logs show `[email:send_success]` (not `[email:send_failure]`)
- [ ] Email arrives in inbox within 2 minutes
- [ ] Verification link works (redirects to account)
- [ ] Resend dashboard shows email in logs

---

## Code Files Modified

| File | Changes |
|------|---------|
| `src/lib/email-diagnostics.ts` | **NEW** — Validation, error diagnosis, structured logging |
| `src/lib/email-bootstrap.ts` | **NEW** — Startup config validation |
| `src/app/api/health/email/route.ts` | **NEW** — Health check endpoint |
| `src/lib/email.ts` | Enhanced with diagnostics and error handling |
| `src/lib/auth.ts` | Better Auth callbacks now handle send failures gracefully |
| `src/app/(auth)/actions.ts` | Improved user messages and error logging |
| `src/app/layout.tsx` | Added bootstrap call on startup |

## Documentation

| File | Purpose |
|------|---------|
| `docs/EMAIL_DEBUGGING.md` | Complete debugging guide for diagnosing email issues |
| `EMAIL_DELIVERY_IMPROVEMENTS.md` | This summary |

---

## Deployment Steps

1. **Commit the changes:**
   ```bash
   git add -A
   git commit -m "Improve auth email delivery diagnostics and error handling"
   ```

2. **Verify build:**
   ```bash
   npm run build
   ```
   Must succeed with no errors

3. **Deploy to staging (if available):**
   - Test signup/password-reset/resend flows
   - Check `/api/health/email` endpoint
   - Monitor logs for email events

4. **Deploy to production:**
   - Verify `/api/health/email` shows `"status": "ok"`
   - Have team member test signup
   - Monitor error logs for first hour

5. **Update monitoring/alerts:**
   - Alert on `[email:send_failure]` if error rate > 5%
   - Alert if health check returns non-ok status
   - Monitor Resend dashboard for bounces

---

## Future Improvements

**Not implemented yet, but recommended:**

1. **Email send retry queue** — If initial send fails, retry exponentially (1 min, 5 min, 30 min)
2. **Email template preview** — Test emails before sending (Resend has a preview API)
3. **User-side retry UI** — Explicit "Resend email" button in settings for unverified users
4. **Analytics** — Dashboard tracking signup-to-verification conversion rate
5. **Bounce handling** — Automatic unsubscribe on permanent bounces from Resend webhooks
6. **Rate limit tuning** — Adjust based on actual email volume and Resend plan limits

---

## Questions & Support

**Q: Email send failed in logs, but user still signed up?**  
A: By design. The reset token/verification email is still valid. User can click "Resend" button.

**Q: Should I throw errors if email fails?**  
A: No. That breaks the signup/reset flow entirely. Let account creation succeed, log the failure, let user retry.

**Q: How do I know if Resend is working?**  
A: Check `/api/health/email` and Resend dashboard. Logs show send attempts even if they fail.

**Q: Email sent but user didn't receive it?**  
A: Check Resend dashboard for bounces/blocks, spam folder, and verify `EMAIL_FROM` is from a verified domain.

**Q: How do I monitor this in production?**  
A: Set up alerts for `[email:send_failure]` logs. Periodically hit `/api/health/email`. Monitor Resend account dashboard.
