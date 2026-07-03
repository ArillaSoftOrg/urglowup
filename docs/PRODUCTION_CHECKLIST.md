# UrGlowUp Production Checklist

## Pre-Deployment

### Operational Commands

- `npm run release:check`
  Runs env validation, lint, typecheck, and a production build before deployment.
- `npm run smoke:deploy -- https://yourdomain.com`
  Runs a lightweight post-deploy smoke check against the live URL.

### Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Neon connection pooler URL |
| `DIRECT_URL` | Yes | Neon direct URL for migrations |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app origin, e.g. `https://urglowup.vercel.app` |
| `BETTER_AUTH_URL` | Recommended | Usually same as `NEXT_PUBLIC_APP_URL` in production |
| `BETTER_AUTH_SECRET` | Yes | Long random secret, minimum 32 chars |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Optional | Comma-separated extra origins for preview/admin aliases |
| `CLOUDINARY_API_KEY` | Yes | From Cloudinary Console |
| `CLOUDINARY_API_SECRET` | Yes | From Cloudinary Console |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | From Cloudinary Console |
| `RESEND_API_KEY` | Yes | From Resend Dashboard |
| `EMAIL_FROM` | Yes | Verified sender address in Resend |
| `EMAIL_REPLY_TO` | Optional | Support inbox for user replies |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Yes in production | Cloudflare Turnstile site key for auth bot protection |
| `TURNSTILE_SECRET_KEY` | Yes in production | Cloudflare Turnstile secret key for server-side verification |
| `ADMIN_EMAILS` | Recommended | Comma-separated emails promoted to `ADMIN` on login |
| `AUTH_RATE_LIMIT_LOGIN_IP` | Optional | Defaults to 30 attempts / 10 minutes per IP |
| `AUTH_RATE_LIMIT_LOGIN_EMAIL` | Optional | Defaults to 5 attempts / 10 minutes per email |
| `AUTH_RATE_LIMIT_FORGOT_PASSWORD_IP` | Optional | Defaults to 30 attempts / hour per IP |
| `AUTH_RATE_LIMIT_FORGOT_PASSWORD_EMAIL` | Optional | Defaults to 3 attempts / hour per email |
| `AUTH_RATE_LIMIT_RESET_PASSWORD_IP` | Optional | Defaults to 30 attempts / hour per IP |
| `AUTH_RATE_LIMIT_RESET_PASSWORD_TOKEN` | Optional | Defaults to 5 attempts / hour per token |
| `AUTH_RATE_LIMIT_VERIFICATION_IP` | Optional | Defaults to 30 attempts / hour per IP |
| `AUTH_RATE_LIMIT_VERIFICATION_EMAIL` | Optional | Defaults to 3 attempts / hour per email |
| `GOOGLE_CLIENT_ID` | Optional | Required only for Google Business Profile integration |
| `GOOGLE_CLIENT_SECRET` | Optional | Required only for Google Business Profile integration |
| `GOOGLE_REDIRECT_URI` | Optional | Must match your Google OAuth app |
| `GOOGLE_BUSINESS_PROFILE_SCOPES` | Optional | Usually `https://www.googleapis.com/auth/business.manage` |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | Recommended | 64-char hex key for encrypted external tokens |
| `GOOGLE_AUTH_CLIENT_ID` | Optional | Google Sign-In for end-user auth (separate OAuth app from Business Profile) |
| `GOOGLE_AUTH_CLIENT_SECRET` | Optional | Google Sign-In for end-user auth |

### Better Auth

- [ ] `BETTER_AUTH_SECRET` generated securely
- [ ] `BETTER_AUTH_URL` set to the production origin if needed
- [ ] `BETTER_AUTH_TRUSTED_ORIGINS` includes preview/admin aliases if they are allowed to initiate auth flows
- [ ] `trustedProxyHeaders` is only enabled behind the known production proxy/CDN path that sets `x-forwarded-for` / `x-real-ip`
- [ ] Better Auth cookies are issued with the `urglowup` prefix in production
- [ ] `/api/auth/[...all]` route is deployed and reachable
- [ ] Register flow works
- [ ] Login flow works
- [ ] Forgot-password flow sends reset email
- [ ] Email verification flow sends verification email
- [ ] Turnstile site and secret keys are configured in production
- [ ] Auth rate-limit overrides, if set, are positive integers
- [ ] Auth logs mask email addresses and redact reset tokens / callback URLs

### Google Sign-In (optional)

> Only required if `GOOGLE_AUTH_CLIENT_ID` + `GOOGLE_AUTH_CLIENT_SECRET` are set.

- [ ] Create a separate OAuth 2.0 client in Google Cloud Console (do **not** reuse the Business Profile client)
- [ ] Add authorized redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google`
- [ ] Add authorized JavaScript origin: `{BETTER_AUTH_URL}`
- [ ] Set `GOOGLE_AUTH_CLIENT_ID` and `GOOGLE_AUTH_CLIENT_SECRET` in production environment
- [ ] "Google ile devam et" button appears on login and register pages
- [ ] Clicking the button redirects to Google consent and returns a logged-in session
- [ ] Existing email/password accounts are not merged automatically (Better Auth creates a new Account row)

### Personalization & Consent

- [ ] `npx prisma migrate deploy` applied — confirms `UserPreferences`, `ConsentAuditLog` tables exist
- [ ] Privacy policy (`/privacy-policy`) is accessible and up to date; replace `[OPERATOR: ...]` placeholders with real company details before launch
- [ ] Account settings page (`/account/settings`) shows "Gizlilik ve Onay" section with personalization toggle
- [ ] Granting consent writes `personalizationConsentAt` + a `ConsentAuditLog` GRANTED row
- [ ] Revoking consent writes `personalizationRevokedAt`, clears affinity fields, + a REVOKED row
- [ ] İlham feed at `/explore?tab=ilham` shows personalized order for users with active consent
- [ ] Personalization nudge banner visible to logged-in users who have not yet consented; dismissible

### Resend Email Setup

- [ ] Sending domain verified in Resend
- [ ] `EMAIL_FROM` uses the verified domain
- [ ] `EMAIL_REPLY_TO` routes to a monitored inbox if user replies should be handled
- [ ] Verification email is delivered
- [ ] Password reset email is delivered

### Cloudinary

- [ ] Signed uploads only
- [ ] Upload folder rules are correct

### Database

- [ ] `npx prisma migrate deploy` applied successfully
- [ ] Better Auth tables exist: `Session`, `Account`, `Verification`, `RateLimit`
- [ ] Latest schema includes `User.name` and `User.emailVerified`

---

## Post-Deployment Verification

- [ ] `npm run smoke:deploy -- https://yourdomain.com` passes
- [ ] `GET /api/health` returns HTTP 200
- [ ] Home page loads without errors
- [ ] Customer can register
- [ ] Customer receives verification email
- [ ] Customer can login after verification
- [ ] Forgot-password email arrives and reset flow completes
- [ ] Admin email from `ADMIN_EMAILS` can access `/admin`
- [ ] Business owner can complete onboarding
- [ ] Customer can request an appointment
- [ ] Appointment appears in business dashboard
- [ ] Media upload works

---

## Admin Bootstrap

1. Add the email to `ADMIN_EMAILS`
2. Log in with that account
3. The account is promoted to `ADMIN` on login
4. Visit `/admin`

Notes:

- Multiple emails: `ADMIN_EMAILS=alice@example.com,bob@example.com`
- Removing an email from `ADMIN_EMAILS` does not demote an already-promoted user
- Production `ADMIN_EMAILS` must be limited to founder/operator-owned inboxes. Do not include shared, contractor, or unverified mailbox aliases.
- Admin social login stays disabled; admin access must use email/password plus MFA.

---

## Incident Response

### Users cannot log in

1. Confirm `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`
2. Confirm `BETTER_AUTH_TRUSTED_ORIGINS` covers the active frontend origin
3. Confirm `DATABASE_URL` is reachable
4. Check app logs for Better Auth errors
5. Verify `Session` and `Account` tables exist

### Password reset emails are not arriving

1. Check `RESEND_API_KEY`
2. Check `EMAIL_FROM`
3. Confirm sending domain is verified
4. Check Resend logs for bounces or rejections
5. Check app logs for `auth.email_failed` with `flow=password_reset`
6. Confirm reset URLs in logs are redacted; never paste raw reset links into tickets

### Verification emails are not arriving

1. Check Resend setup
2. Confirm `/api/auth/[...all]` is reachable
3. Inspect application logs for Better Auth email errors
4. Check app logs for `auth.email_failed` with `flow=email_verification`

### Suspicious auth traffic or brute force

1. Check app logs for `auth.rate_limited`
2. Review the affected flow (`login`, `forgot_password`, `reset_password`, or `verification`)
3. Tighten the matching `AUTH_RATE_LIMIT_*` override if needed
4. Confirm Turnstile is active in production
