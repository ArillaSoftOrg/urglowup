# `.env.local` Example Matrix

This matrix shows what each environment variable should look like in local development and production.

For a copy-ready local example, see [.env.local.example](/C:/Users/YUSUF/Documents/GitHub/urglowup/.env.local.example).

| Variable | Local Example | Production Example | Required |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://urglowup.vercel.app` | Yes |
| `BETTER_AUTH_URL` | `http://localhost:3000` | `https://urglowup.vercel.app` | Recommended |
| `BETTER_AUTH_SECRET` | long random string | long random string | Yes |
| `BETTER_AUTH_TRUSTED_ORIGINS` | empty or extra localhost aliases | `https://admin.yourdomain.com,https://preview.yourdomain.com` | Optional |
| `DATABASE_URL` | local Postgres URL | Neon pooler URL | Yes |
| `DIRECT_URL` | local Postgres URL | Neon direct URL | Yes |
| `RESEND_API_KEY` | test key | production key | Yes |
| `EMAIL_FROM` | `UrGlowUp <onboarding@resend.dev>` | `UrGlowUp <notifications@yourdomain.com>` | Yes |
| `EMAIL_REPLY_TO` | `support@example.com` | `support@yourdomain.com` | Optional |
| `ADMIN_EMAILS` | `admin@example.com` | `founder@yourdomain.com` | Recommended |
| `CLOUDINARY_API_KEY` | local/dev key | production key | Yes |
| `CLOUDINARY_API_SECRET` | local/dev secret | production secret | Yes |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | dev cloud name | production cloud name | Yes |
| `GOOGLE_CLIENT_ID` | local OAuth app client ID | production OAuth app client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | local OAuth app secret | production OAuth app secret | Optional |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3000/api/integrations/google/callback` | `https://urglowup.vercel.app/api/integrations/google/callback` | Optional |
| `GOOGLE_BUSINESS_PROFILE_SCOPES` | `https://www.googleapis.com/auth/business.manage` | same | Optional |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | 64-char hex | 64-char hex | Recommended |
| `INTERNAL_API_SECRET` | random string | random string | Optional |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | browser key | browser key | Optional |
| `GOOGLE_MAPS_SERVER_API_KEY` | server key | server key | Optional |
| `WHATSAPP_NOTIFICATIONS_ENABLED` | `false` | `true` or `false` | Optional |
| `WHATSAPP_DRY_RUN` | `true` | `false` | Optional |
| `WHATSAPP_PHONE_NUMBER_ID` | sandbox or test id | production id | Optional |
| `WHATSAPP_ACCESS_TOKEN` | sandbox or test token | production token | Optional |
| `WHATSAPP_TEMPLATE_BOOKING_CONFIRMED` | template name | production template name | Optional |
| `WHATSAPP_TEMPLATE_LANGUAGE` | `tr` | `tr` | Optional |
| `WHATSAPP_API_VERSION` | `v21.0` | `v21.0` | Optional |
| `WHATSAPP_APP_ID` | test app's App ID | production app's App ID | Optional — reserved for a future JS-SDK Embedded Signup flow, unused by the current webhook-driven flow |
| `WHATSAPP_APP_SECRET` | test app's App Secret | production app's App Secret | Required for webhook signature verification (X-Hub-Signature-256), server-only |
| `WHATSAPP_REDIRECT_URI` | `http://localhost:3000/api/integrations/whatsapp/callback` | `https://urglowup.vercel.app/api/integrations/whatsapp/callback` | Optional — reserved for a future JS-SDK flow; the callback route itself no longer reads this |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | random string | random string | Required for the webhook route's GET verification |
| `WHATSAPP_EXPECTED_PHONE_NUMBER` | your test number, E.164 | the real Urglowup number, E.164 (`+90...`) | Required for post-PARTNER_ADDED phone-number matching — never auto-selects "the first" number |
| `WHATSAPP_SYSTEM_USER_ACCESS_TOKEN` | a test System User token | production System User token, manually generated in Meta Business Settings | Required for the post-PARTNER_ADDED `/phone_numbers` Graph API call — see Phase 1.2 report's "Access Token Strategy" |

## Quick Notes

- `BETTER_AUTH_URL` should usually match `NEXT_PUBLIC_APP_URL`.
- `BETTER_AUTH_TRUSTED_ORIGINS` is only needed when extra origins are allowed to start auth flows.
- `BETTER_AUTH_SECRET` should never be reused across projects.
- `DIRECT_URL` is for Prisma migrations; app runtime should prefer `DATABASE_URL`.
- Resend sender domain must be verified before production email delivery works.
- `EMAIL_REPLY_TO` is useful when you want verification/reset replies to land in a monitored support inbox.
