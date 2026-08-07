# UrGlowUp Web MVP

## Goal

Build **UrGlowUp**, a scalable web MVP for beauty and personal care businesses.

UrGlowUp lets customers discover a business profile, view services, photos/videos, reviews, and create appointment requests. Businesses get a dashboard to manage profile data, services, media, working hours, appointments, reviews, customers, and their public booking link.

---

## Tech Stack

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- Neon PostgreSQL
- Better Auth
- Cloudinary
- Zod
- React Hook Form
- Vercel

Keep provider-specific logic isolated where possible.

---

## Auth Rules

Use Better Auth.

Enable:

- email + password
- email verification
- password reset
- session-backed auth with Prisma

Customer account is required before creating an appointment request.

Business registration has a separate flow.

Keep auth and role checks centralized.

---

## Environment Variables

```env
DATABASE_URL=
DIRECT_URL=

NEXT_PUBLIC_APP_URL=
BETTER_AUTH_URL=
BETTER_AUTH_SECRET=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RESEND_API_KEY=
EMAIL_FROM=

ADMIN_EMAILS=
```

Optional integration envs:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_BUSINESS_PROFILE_SCOPES=
OAUTH_TOKEN_ENCRYPTION_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_SERVER_API_KEY=
```

---

## Implementation Rules

- Use TypeScript strictly.
- Use server-side validation with Zod.
- Keep business logic outside UI components where possible.
- Keep Cloudinary logic isolated.
- Keep auth/role checks centralized.
- Use responsive design from the start.
- Avoid unrelated refactors when implementing targeted tasks.

---

## Current Auth Notes

- Auth route is mounted at `/api/auth/[...all]`
- Better Auth uses Prisma-backed `Session`, `Account`, `Verification`, and `RateLimit` models
- Verification and password reset emails are sent with Resend
- Admin role promotion is based on `ADMIN_EMAILS`
