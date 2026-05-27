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

## Not Enabled Yet

- Social login is not wired into Better Auth yet.
- Existing `GOOGLE_CLIENT_ID` and related Google envs are currently for the Google Business Profile integration, not for end-user sign-in.
- If Google sign-in is enabled later, use separate auth-focused verification and callback checks before launch.

## Database Models

Better Auth depends on these Prisma models:

- `User`
- `Session`
- `Account`
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

For a full local example, see [.env.local.example](/C:/Users/YUSUF/Documents/GitHub/urglowup/.env.local.example).

## Operational Notes

- Verification and password reset emails are sent with Resend.
- Auth emails are awaited. If Resend rejects delivery, the auth action fails instead of silently succeeding.
- `trustedOrigins` is derived from `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL`, and optional `BETTER_AUTH_TRUSTED_ORIGINS`.
- Better Auth cookies use the `urglowup` prefix and trust forwarded proxy headers in production.
- Password reset revokes existing sessions.
- Protected routes are optimistically checked in [src/proxy.ts](/C:/Users/YUSUF/Documents/GitHub/urglowup/src/proxy.ts) and fully resolved server-side through `getCurrentUser()`.
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
