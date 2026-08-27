/**
 * WHATSAPP_REDIRECT_URI landing endpoint.
 *
 * Phase 1.2 correction: this route does NOT process WhatsApp onboarding
 * credentials. Phase 1 assumed the Meta-hosted "Generate link" flow would
 * redirect here with `?code=...` and built a full OAuth token-exchange
 * pipeline around that. Phase 1.1's research and Phase 1.2's instructions
 * established that assumption doesn't hold for the Meta-hosted flow this
 * app actually uses: Meta signals onboarding completion via the
 * account_update / PARTNER_ADDED webhook
 * (api/webhooks/whatsapp/route.ts), not via a redirect carrying a code.
 *
 * Whatever this URL is actually used for in the Meta-hosted flow (a plain
 * post-completion landing page, most likely — see the Phase 1.1 report's
 * "Redirect URI Behaviour" section for what's still unconfirmed), it must
 * still be a *registered, reachable* URL for Meta's app configuration. This
 * route exists to satisfy that requirement safely: it does not expect an
 * authorization code, does not read or log any query string value (Meta
 * could in principle append anything here — this route treats all of it as
 * untrusted, unused input), performs no token exchange, and persists
 * nothing. It is not an API-credential-bearing endpoint and must never
 * become one again without re-confirming Meta's actual redirect behavior
 * first.
 *
 * The original OAuth exchange code (oauth.ts, the OAuth-discovery half of
 * discovery.ts) is preserved for a possible future JS-SDK Embedded Signup
 * flow — nothing here calls it.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "WhatsApp onboarding tamamlandı. Bağlantı durumu Meta tarafında ayrıca doğrulanıyor.",
  });
}
