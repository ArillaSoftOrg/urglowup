import { resolveClientIp } from "@/lib/client-ip";

// Optional network gate for /admin. Reads a comma-separated ADMIN_IP_ALLOWLIST
// of IPv4/IPv6 addresses or CIDR ranges. Empty/unset ⇒ allowlist disabled
// (every IP allowed). Intentionally dependency-free (no Prisma / DB imports)
// so it can run inside the proxy without bloating the bundle.

type HeaderReader = Pick<Headers, "get">;

type ParsedIp = { bits: bigint; version: 4 | 6 };

// ES2017 target — use the BigInt() constructor instead of `n` literals.
const ZERO = BigInt(0);
const ONE = BigInt(1);
const SHIFT_8 = BigInt(8);
const SHIFT_16 = BigInt(16);

function parseIp(value: string): ParsedIp | null {
  const trimmed = value.trim();

  if (trimmed.includes(":")) {
    return parseIpv6(trimmed);
  }

  return parseIpv4(trimmed);
}

function parseIpv4(value: string): ParsedIp | null {
  const parts = value.split(".");
  if (parts.length !== 4) {
    return null;
  }

  let bits = ZERO;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    const octet = Number(part);
    if (octet > 255) {
      return null;
    }
    bits = (bits << SHIFT_8) | BigInt(octet);
  }

  return { bits, version: 4 };
}

function parseIpv6(value: string): ParsedIp | null {
  // Strip a zone id (e.g. fe80::1%eth0) — not used for matching.
  const address = value.split("%")[0];
  const halves = address.split("::");
  if (halves.length > 2) {
    return null;
  }

  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];

  const missing = 8 - (head.length + tail.length);
  if (halves.length === 1 && head.length !== 8) {
    return null;
  }
  if (halves.length === 2 && missing < 1) {
    return null;
  }

  const groups =
    halves.length === 2
      ? [...head, ...Array(missing).fill("0"), ...tail]
      : head;

  if (groups.length !== 8) {
    return null;
  }

  let bits = ZERO;
  for (const group of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) {
      return null;
    }
    bits = (bits << SHIFT_16) | BigInt(parseInt(group, 16));
  }

  return { bits, version: 6 };
}

function matchesEntry(client: ParsedIp, entry: string): boolean {
  const [addressPart, prefixPart] = entry.split("/");
  const target = parseIp(addressPart);
  if (!target || target.version !== client.version) {
    return false;
  }

  const fullWidth = client.version === 4 ? 32 : 128;
  const prefix = prefixPart === undefined ? fullWidth : Number(prefixPart);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > fullWidth) {
    return false;
  }

  if (prefix === 0) {
    return true;
  }

  const shift = BigInt(fullWidth - prefix);
  const mask = ((ONE << BigInt(prefix)) - ONE) << shift;
  return (client.bits & mask) === (target.bits & mask);
}

/**
 * Returns true if the request's client IP is permitted to reach /admin.
 * When ADMIN_IP_ALLOWLIST is empty/unset the allowlist is disabled and every
 * request is allowed. When set, an unparseable/missing client IP is denied.
 */
export function isAdminIpAllowed(headers: HeaderReader): boolean {
  const raw = process.env.ADMIN_IP_ALLOWLIST;
  const entries = (raw ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    return true; // disabled
  }

  const clientIp = resolveClientIp(headers);
  if (!clientIp) {
    return false;
  }

  const parsed = parseIp(clientIp);
  if (!parsed) {
    return false;
  }

  return entries.some((entry) => matchesEntry(parsed, entry));
}
