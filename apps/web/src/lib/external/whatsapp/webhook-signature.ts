/**
 * Meta webhook payload authenticity verification (X-Hub-Signature-256).
 *
 * Mirrors the HMAC + timing-safe-compare pattern already used for Resend's
 * Svix-signed webhook (apps/web/src/app/api/webhooks/resend/route.ts's
 * verifySvixSignature) — same shape, different algorithm/header per Meta's
 * documented scheme: HMAC-SHA256(rawBody, WHATSAPP_APP_SECRET), hex-encoded,
 * prefixed "sha256=".
 *
 * Must run on the RAW request body, before JSON.parse — signing covers the
 * exact bytes Meta sent, not a re-serialized/re-parsed representation.
 *
 * This file is SERVER-ONLY. Never import in client components.
 */
import { createHmac, timingSafeEqual } from "crypto";

const SIGNATURE_PREFIX = "sha256=";

/**
 * Verifies a Meta X-Hub-Signature-256 header against the raw request body.
 *
 * @param rawBody         Exact request body bytes/string, unparsed.
 * @param signatureHeader The `X-Hub-Signature-256` header value, or null/undefined if absent.
 * @param appSecret       WHATSAPP_APP_SECRET — never logged.
 * @returns               true only if the header is present, correctly formatted, and matches.
 */
export function verifyWhatsAppWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith(SIGNATURE_PREFIX)) {
    return false;
  }

  const providedHex = signatureHeader.slice(SIGNATURE_PREFIX.length);

  let providedBuf: Buffer;
  try {
    providedBuf = Buffer.from(providedHex, "hex");
  } catch {
    return false;
  }

  // A malformed (non-hex) header decodes to a shorter/garbage buffer rather
  // than throwing — reject before timingSafeEqual, which requires equal
  // lengths and throws otherwise.
  if (providedBuf.length === 0 || providedHex.length % 2 !== 0) {
    return false;
  }

  const expectedHex = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const expectedBuf = Buffer.from(expectedHex, "hex");

  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}
