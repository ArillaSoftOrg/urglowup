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
| `ADMIN_EMAILS` | Recommended | Comma-separated emails promoted to `ADMIN` on login |
| `GOOGLE_CLIENT_ID` | Optional | Required only for Google Business Profile integration |
| `GOOGLE_CLIENT_SECRET` | Optional | Required only for Google Business Profile integration |
| `GOOGLE_REDIRECT_URI` | Optional | Must match your Google OAuth app |
| `GOOGLE_BUSINESS_PROFILE_SCOPES` | Optional | Usually `https://www.googleapis.com/auth/business.manage` |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | Recommended | 64-char hex key for encrypted external tokens |

### Better Auth

- [ ] `BETTER_AUTH_SECRET` generated securely
- [ ] `BETTER_AUTH_URL` set to the production origin if needed
- [ ] `BETTER_AUTH_TRUSTED_ORIGINS` includes preview/admin aliases if they are allowed to initiate auth flows
- [ ] Better Auth cookies are issued with the `urglowup` prefix in production
- [ ] `/api/auth/[...all]` route is deployed and reachable
- [ ] Register flow works
- [ ] Login flow works
- [ ] Forgot-password flow sends reset email
- [ ] Email verification flow sends verification email

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

### Verification emails are not arriving

1. Check Resend setup
2. Confirm `/api/auth/[...all]` is reachable
3. Inspect application logs for Better Auth email errors
