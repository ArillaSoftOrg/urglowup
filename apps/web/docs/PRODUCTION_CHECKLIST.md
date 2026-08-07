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
| `ADMIN_IP_ALLOWLIST` | Optional | Comma-separated IPv4/IPv6 addresses or CIDR ranges allowed to reach `/admin`. Empty/unset disables the gate. Only safe behind a trusted proxy/CDN (see Admin Hardening) |
| `CSP_REPORT_ONLY` | Optional | Emergency rollback. CSP is **enforced by default**; set to `true` to switch the header back to Report-Only |
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

### Content-Security-Policy

The CSP is defined in `next.config.ts` and applied to every response alongside
the existing HSTS / `X-Frame-Options` / `X-Content-Type-Options` /
`Referrer-Policy` / `Permissions-Policy` headers.

- [ ] **Enforced by default** — the header is `Content-Security-Policy`, so
      disallowed sources are blocked, not just reported.
- [ ] **Rollback switch:** set **`CSP_REPORT_ONLY=true`** to fall back to
      `Content-Security-Policy-Report-Only` (violations reported, nothing
      blocked). Use this if enforcement breaks something in production, then
      redeploy; investigate the report and add the missing origin before
      re-enforcing.
- [ ] Allowed sources cover the app's real dependencies: `self`, Cloudinary
      (`res.cloudinary.com`), Cloudflare Turnstile (`challenges.cloudflare.com`
      scripts + frame), Google Maps (`maps.googleapis.com`, `maps.gstatic.com`,
      `*.googleapis.com`, `*.gstatic.com`), Clerk avatar images
      (`img.clerk.com`), and `data:` / `blob:` for crop/QR/media.
- [ ] **After deploy, manually smoke test** that enforcement did not block a
      required asset/script: login, register, password reset, admin MFA
      challenge, Cloudflare Turnstile widget, Cloudinary image display + media
      uploads, and any map / external widgets. Watch the browser console for CSP
      violation errors during each flow.
- [ ] **Follow-up hardening (not yet done):** `script-src` and `style-src`
      currently include `'unsafe-inline'` to accommodate the app's first-party
      inline scripts (theme toggle + JSON-LD) and injected styles (Tailwind v4 +
      Google Maps). Tightening to hashes/nonces would require moving CSP into the
      proxy and forcing dynamic rendering — track as a separate task.

### Application Rate Limiting

Beyond the four auth flows, sensitive write endpoints/actions are rate limited
via `src/lib/rate-limit.ts` (`enforceRateLimit`), which reuses the same
Postgres `RateLimit` table as the auth limiter under an `app-action:` key
prefix. Limits are keyed by client IP plus the authenticated user/business id.

- [ ] Covered scopes: `media-sign` (Cloudinary signature APIs), `media-action`
      (media/post like, save, delete, create), `booking` (appointment request +
      waitlist join), `claim` (business claim), `message` (customer + business
      message send), `review` (submit/update + business reply).
- [ ] Thresholds are intentionally generous (normal use never hits them); they
      are defined at each call site — adjust in code if a scope needs tuning.
- [ ] Rate-limited responses return an HTTP 429 with `Retry-After` (API routes)
      or a user-safe Turkish message (server actions); no secrets are leaked.

### Admin Hardening

- [ ] `/admin` access remains gated by the proxy session-cookie check plus the
      `requireAdminMfa()` server guard (role + verified TOTP) — unchanged.
- [ ] Optional network gate: set **`ADMIN_IP_ALLOWLIST`** to restrict the whole
      `/admin` surface to known IPs/CIDRs. **Only enable behind a trusted
      proxy/CDN** that sets `x-forwarded-for` / `x-real-ip` (same prerequisite as
      `trustedProxyHeaders`); otherwise clients could spoof the header. Empty =
      disabled.
- [ ] New security log events to alert on: `admin.login_failed` (failed sign-in
      for an `ADMIN_EMAILS` address), `admin.mfa_challenge_failed` (failed TOTP /
      backup code at the MFA challenge), `admin.ip_denied` (request to `/admin`
      from a non-allowlisted IP). All are console-structured and mask identities.

---

## Infrastructure & Operational Security

> **[External / manual — not code-enforced.]** These items are configured on
> your hosting/CDN/DNS providers and operational runbooks, not in this
> repository. The app cannot enforce them; this checklist tracks that they are
> in place.

### Edge protection (WAF / CDN / DDoS)

- [ ] A WAF / CDN sits in front of the app with automatic DDoS mitigation
      (e.g. Cloudflare WAF or **Vercel Firewall**).
- [ ] Edge rate limiting and/or managed rule sets are enabled for abusive
      traffic patterns; app-level limits above are a second layer, not the first.
- [ ] An "attack mode" / challenge escalation path is documented for incidents.
- [ ] The app is only reachable through the CDN/proxy so that
      `x-forwarded-for` / `x-real-ip` (used by rate limiting and
      `ADMIN_IP_ALLOWLIST`) are trustworthy and not client-spoofable.

### DNS

- [ ] **DNSSEC** is enabled on the domain.
- [ ] CAA records restrict which CAs may issue certificates.

### Monitoring & alerting

- [ ] Application logs are shipped to a central sink (not just ephemeral
      platform logs).
- [ ] Alerts fire on spikes of `auth.rate_limited` and on any
      `admin.login_failed` / `admin.mfa_challenge_failed` / `admin.ip_denied`.
- [ ] Uptime / health-check monitoring on `GET /api/health`.

### Backups & restore

- [ ] Automated database backups are enabled (managed provider, e.g. Neon PITR).
- [ ] A **restore drill** has been performed and documented — verify backups can
      actually be restored, not just that they exist.

### Secret rotation

- [ ] A rotation cadence + runbook exists for: `BETTER_AUTH_SECRET`,
      `OAUTH_TOKEN_ENCRYPTION_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`,
      WhatsApp access token, `INTERNAL_API_SECRET`, and any Google keys.
- [ ] `ADMIN_EMAILS` is reviewed periodically and pruned to current
      founders/operators.

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
5. For repeated abuse of write endpoints, check app logs for `app-action:*` rate
   hits and consider adding an edge WAF rule (external)

### Suspicious admin activity

1. Check app logs for `admin.login_failed` (failed sign-in for an admin inbox)
   and `admin.mfa_challenge_failed` (failed TOTP / backup at the MFA challenge)
2. If an admin credential may be compromised, rotate the password and reset MFA
   for that account, and review recent `AdminAction` rows in `/admin/activity`
3. Consider setting or tightening `ADMIN_IP_ALLOWLIST`; watch for
   `admin.ip_denied` events after enabling it
4. Confirm the app is only reachable via the trusted proxy/CDN so the client IP
   used by the allowlist cannot be spoofed

### CSP is blocking legitimate functionality

CSP is enforced by default, so a misconfigured directive can block a real
asset/script.

1. **Immediate rollback:** set `CSP_REPORT_ONLY=true` and redeploy — the header
   reverts to Report-Only and stops blocking while you diagnose
2. Inspect the reported blocked directive/source (browser console) and add the
   required origin to the matching directive in `next.config.ts`
3. Re-observe in Report-Only, then remove `CSP_REPORT_ONLY` to re-enforce
