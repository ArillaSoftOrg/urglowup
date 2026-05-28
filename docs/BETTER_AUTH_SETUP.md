# Better Auth Setup

## Overview

UrGlowUp uses Better Auth with Prisma-backed sessions.

Core pieces:

- Auth route: `/api/auth/[...all]`
- Config: [src/lib/auth.ts](/C:/Users/YUSUF/Documents/GitHub/urglowup/src/lib/auth.ts)
- Server actions: [src/app/(auth)/actions.ts](/C:/Users/YUSUF/Documents/GitHub/urglowup/src/app/(auth)/actions.ts)
- Auth pages:
  - `/login`
  - `/register`
  - `/forgot-password`
  - `/reset-password`

## Enabled Flows

- Email + password sign up
- Email verification
- Email + password sign in
- Password reset
- Database-backed session management
- Admin role bootstrap via `ADMIN_EMAILS`
- **Google Sign-In** (when `GOOGLE_AUTH_CLIENT_ID` and `GOOGLE_AUTH_CLIENT_SECRET` are set)

## Google Sign-In

Google OAuth is opt-in: the button appears on `/login` and `/register` only when both `GOOGLE_AUTH_CLIENT_ID` and `GOOGLE_AUTH_CLIENT_SECRET` are set.

### How it works

1. User clicks "Google ile devam et" — form submits to `signInWithGoogleAction` server action.
2. Server action calls `auth.api.signInSocial({ provider: "google", disableRedirect: true })` to obtain the Google OAuth URL.
3. Next.js `redirect()` sends the user to `accounts.google.com`.
4. Google redirects back to `{BETTER_AUTH_URL}/api/auth/callback/google` — handled automatically by the existing `/api/auth/[...all]` route.
5. Better Auth creates or links the user account, starts a session, and redirects to `callbackURL` (default `/account`).

> Social-login users bypass email verification because Google has already verified the email (`emailVerified: true` is set automatically).

### Google Cloud Console setup

1. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
2. Application type: **Web application**.
3. Add **Authorized redirect URIs**:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://<your-domain>/api/auth/callback/google`
4. Copy the **Client ID** and **Client Secret**.

> Use a **separate OAuth app** from the Google Business Profile integration. The existing `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are for Business Profile only.

## Not Enabled

- Other social providers (GitHub, Apple, etc.) — not configured.

## Database Models

Better Auth depends on these Prisma models:

- `User`
- `Session`
- `Account` (also stores linked OAuth accounts for Google Sign-In)
- `Verification`
- `RateLimit`

These are defined in [prisma/schema.prisma](/C:/Users/YUSUF/Documents/GitHub/urglowup/prisma/schema.prisma).

## Required Environment Variables

Minimum auth-related envs:

```env
NEXT_PUBLIC_APP_URL=
BETTER_AUTH_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_TRUSTED_ORIGINS=
DATABASE_URL=
DIRECT_URL=
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=
```

Recommended:

```env
ADMIN_EMAILS=
OAUTH_TOKEN_ENCRYPTION_KEY=
```

Google Sign-In (optional — shows button when both are set):

```env
GOOGLE_AUTH_CLIENT_ID=
GOOGLE_AUTH_CLIENT_SECRET=
```

For a full local example, see [.env.local.example](/C:/Users/YUSUF/Documents/GitHub/urglowup/.env.local.example).

## Operational Notes

- Verification and password reset emails are sent with Resend.
- Auth emails are awaited. If Resend rejects delivery, the auth action fails instead of silently succeeding.
- `trustedOrigins` is derived from `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL`, and optional `BETTER_AUTH_TRUSTED_ORIGINS`.
- Better Auth cookies use the `urglowup` prefix and trust forwarded proxy headers in production.
- Password reset revokes existing sessions.
- Protected routes are fully resolved server-side through `getCurrentUser()`.
- Admin role promotion happens on login when the email exists in `ADMIN_EMAILS`.

## Production Checks

Before launch:

- Confirm `/api/auth/[...all]` is reachable
- Confirm register/login/reset flows work end to end
- Confirm Resend delivery works
- Confirm `EMAIL_FROM` uses a verified Resend domain
- Confirm `EMAIL_REPLY_TO` points at a monitored mailbox if you want replies routed to support
- Confirm `BETTER_AUTH_SECRET` is long and unique
- Confirm preview/admin aliases are listed in `BETTER_AUTH_TRUSTED_ORIGINS` when used
- Confirm latest Prisma migration is applied

Google Sign-In (if enabled):

- Confirm `GOOGLE_AUTH_CLIENT_ID` and `GOOGLE_AUTH_CLIENT_SECRET` are set in Vercel for all environments (Production + Preview)
- Confirm the production redirect URI (`https://<domain>/api/auth/callback/google`) is in the Google Cloud Console OAuth app
- Confirm `BETTER_AUTH_URL` is set to the canonical production URL (e.g. `https://urglowup.com`) so the callback URL resolves correctly
- If Vercel preview deployments need Google auth, add each preview URL to `BETTER_AUTH_TRUSTED_ORIGINS` **and** to the Google Console authorized redirect URIs
