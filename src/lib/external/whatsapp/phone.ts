/**
 * Normalizes a Turkish phone number to E.164 format (+90XXXXXXXXXX).
 *
 * Accepted input formats:
 *   +905XXXXXXXXX   → already E.164, returned as-is
 *   905XXXXXXXXX    → +905XXXXXXXXX
 *   05XXXXXXXXX     → +905XXXXXXXXX
 *
 * @returns E.164 string with leading "+", or null if the number cannot be normalized.
 *          Callers must skip the send gracefully on null.
 */
export function normalizeTurkishPhone(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;

  const cleaned = raw.replace(/[\s\-().]/g, "");

  if (/^\+905\d{9}$/.test(cleaned)) return cleaned;
  if (/^905\d{9}$/.test(cleaned)) return `+${cleaned}`;
  if (/^05\d{9}$/.test(cleaned)) return `+9${cleaned}`;

  return null;
}

/**
 * Masks a phone number for safe logging.
 * Returns "[invalid-phone]" for null/empty/non-phone values.
 * Returns "053****4567" format (first 3, last 4, masked middle) for phone-like values.
 */
export function maskPhoneForLogging(raw: string | null | undefined): string {
  if (!raw || raw.trim().length === 0) return "[invalid-phone]";

  const cleaned = raw.replace(/[\s\-().]/g, "");

  // If it looks remotely like a phone (digits only, roughly phone-length), mask it safely
  if (/^\d{7,15}$/.test(cleaned)) {
    const first = cleaned.slice(0, 3);
    const last = cleaned.slice(-4);
    return `${first}****${last}`;
  }

  return "[invalid-phone]";
}
