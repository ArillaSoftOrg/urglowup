# UrGlowUp Production Checklist

## Pre-Deployment

### Environment Variables (Vercel Dashboard → Settings → Environment Variables)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Neon connection pooler URL |
| `DIRECT_URL` | Yes | Neon direct URL (for migrations) |
| `CLERK_SECRET_KEY` | Yes | From Clerk Dashboard → API Keys |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | From Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Yes | From Clerk Dashboard → Webhooks → your endpoint |
| `CLOUDINARY_API_KEY` | Yes | From Cloudinary Console |
| `CLOUDINARY_API_SECRET` | Yes | From Cloudinary Console |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Yes | From Cloudinary Console |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://urglowup.vercel.app` |
| `RESEND_API_KEY` | **Yes** | From Resend Dashboard → API Keys. **Never use `NEXT_PUBLIC_` prefix — server-side only.** |
| `EMAIL_FROM` | **Yes** | Sender address, e.g. `UrGlowUp <notifications@urglowup.com>`. Domain must be verified in Resend. |
| `ADMIN_EMAILS` | Recommended | Comma-separated emails that get ADMIN role on first login |

### Resend Email Setup

- [ ] Account created at resend.com
- [ ] API key created with **Send** permission (not `NEXT_PUBLIC_` — server-side only)
- [ ] Sending domain verified in Resend Dashboard → Domains (or use `onboarding@resend.dev` for testing)
- [ ] `EMAIL_FROM` matches the verified domain (e.g. `UrGlowUp <notifications@urglowup.com>`)
- [ ] On free plan: monitor daily send limit (100/day). Upgrade before launch.

### Clerk Webhook Setup

- [ ] Webhook endpoint URL set to `https://urglowup.vercel.app/api/webhooks/clerk`
- [ ] `CLERK_WEBHOOK_SECRET` in Vercel matches the signing secret shown in Clerk Dashboard → Webhooks
- [ ] Events enabled: `user.created`, `user.updated`, `user.deleted`
- [ ] Webhook is active (not paused)

### Cloudinary

- [ ] Signed uploads only — no unsigned upload presets used
- [ ] Upload folder permissions are set (the app creates folders per business)

### Database

- [ ] `DATABASE_URL` uses the **connection pooler** URL from Neon (not the direct URL)
- [ ] `DIRECT_URL` uses the direct connection URL (used by Prisma for migrations)
- [ ] All migrations applied: `npx prisma migrate deploy`

---

## Post-Deployment Verification

Run these checks after every production deployment:

- [ ] `GET /api/health` returns `{ "status": "ok" }` with HTTP 200
- [ ] Home page loads without errors
- [ ] Register a new customer account → appears in Admin → Users
- [ ] Admin email (from `ADMIN_EMAILS`) can access `/admin` after logging in
- [ ] Business owner can complete onboarding flow
- [ ] Customer can browse to `/b/[slug]` and request an appointment
- [ ] Appointment appears in the business dashboard under Appointments → Pending
- [ ] Business owner can confirm or reject the appointment
- [ ] Media upload works (signed upload to Cloudinary)

---

## Admin Bootstrap

To grant admin access without touching the database:

1. Add the email address to `ADMIN_EMAILS` in Vercel environment variables
2. Redeploy (or wait for next deployment)
3. The user logs out and logs back in → role is automatically promoted to ADMIN
4. Navigate to `/admin` — access is granted

**Notes:**
- Multiple emails: `ADMIN_EMAILS=alice@example.com,bob@example.com`
- Existing users are promoted on next login — no re-registration needed
- Removing an email from `ADMIN_EMAILS` does NOT demote the user (safe to remove without side effects)
- To manually revoke admin, update the `role` field in the database directly

---

## Ongoing Operations

### Adding a New Business Category

Admin panel → Categories → Add Category

### Approving a Business

1. Business owner completes onboarding → status becomes `PENDING_APPROVAL`
2. Admin panel → Businesses → find the business → change status to `ACTIVE_PRIVATE`
3. Business page at `/b/[slug]` is now publicly accessible

### Promoting to Marketplace

Admin panel → Businesses → find the business → change status to `ACTIVE_MARKETPLACE`

### Suspending a Business

Admin panel → Businesses → find the business → change status to `SUSPENDED`
The public page returns 404 while suspended.

### Monitoring Webhook Delivery

Clerk Dashboard → Webhooks → your endpoint → Recent Deliveries

Failed deliveries show the response status. A 500 means the DB was temporarily unavailable (svix will retry). A 400 means a signature mismatch (check `CLERK_WEBHOOK_SECRET`).

---

## Incident Response

### Users can't log in / protected routes redirect to homepage

1. Check Clerk Dashboard → user exists and is active
2. Check `GET /api/health` — is the DB reachable?
3. Check Vercel Function logs for errors in `getCurrentUser()`
4. If DB is fine but user has no DB record: the fallback sync in `getCurrentUser()` should create it automatically on next login attempt

### Admin panel inaccessible (redirect to homepage)

1. Confirm the user's email is in `ADMIN_EMAILS` env var
2. User must log out and log back in to trigger promotion
3. If `ADMIN_EMAILS` is not set, manually update DB: `UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com'`

### Webhook delivery failing (400 errors in Clerk)

- `CLERK_WEBHOOK_SECRET` mismatch — regenerate the secret in Clerk Dashboard, update in Vercel, redeploy

### Webhook delivery failing (500 errors in Clerk)

- Transient DB issue — svix will retry automatically (up to 5 times over 24 hours)
- Check Neon DB status and connection pooler health
