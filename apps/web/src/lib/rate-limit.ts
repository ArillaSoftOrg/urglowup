import { createHash } from "crypto";
import { db } from "./db";

export type HeaderReader = Pick<Headers, "get">;

export type RateLimitRule = {
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  ok: boolean;
  retryAfterSeconds: number;
};

export type EnforceResult = {
  ok: boolean;
  retryAfterSeconds: number;
  message: string;
};

// Turkish, matches the tone of the existing auth rate-limit copy.
const RATE_LIMIT_MESSAGE =
  "Çok fazla istek gönderildi. Lütfen birkaç dakika sonra tekrar deneyin.";

export function readPositiveIntEnv(key: string, fallback: number) {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

export function getClientIp(headers: HeaderReader) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function hashIdentifier(value: string) {
  return createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex")
    .slice(0, 24);
}

export async function consumeRateLimit(
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const now = BigInt(Date.now());

  return db.$transaction(async (tx) => {
    const existing = await tx.rateLimit.findUnique({
      where: { key: rule.key },
    });

    if (!existing) {
      await tx.rateLimit.create({
        data: {
          key: rule.key,
          count: 1,
          lastRequest: now,
        },
      });

      return {
        ok: true,
        retryAfterSeconds: 0,
      };
    }

    const elapsedMs = Number(now - existing.lastRequest);
    if (elapsedMs >= rule.windowMs) {
      await tx.rateLimit.update({
        where: { key: rule.key },
        data: {
          count: 1,
          lastRequest: now,
        },
      });

      return {
        ok: true,
        retryAfterSeconds: 0,
      };
    }

    if (existing.count >= rule.limit) {
      return {
        ok: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((rule.windowMs - elapsedMs) / 1000),
        ),
      };
    }

    await tx.rateLimit.update({
      where: { key: rule.key },
      data: {
        count: existing.count + 1,
        lastRequest: now,
      },
    });

    return {
      ok: true,
      retryAfterSeconds: 0,
    };
  });
}

const TEN_MINUTES_MS = 10 * 60 * 1000;

type EnforceRateLimitOptions = {
  /** Logical bucket, e.g. "media-sign", "booking", "claim". */
  scope: string;
  headers: HeaderReader;
  /** Authenticated user/business id, when available, for a per-subject bucket. */
  subjectId?: string;
  ipLimit: number;
  ipWindowMs?: number;
  subjectLimit?: number;
  subjectWindowMs?: number;
};

/**
 * Generic app-level rate limiter for sensitive write endpoints/actions.
 * Reuses the same Postgres-backed fixed-window store as the auth limiter,
 * namespaced under `app-action:` to avoid collisions with `app-auth:` keys.
 *
 * Returns `{ ok, retryAfterSeconds, message }` and never throws — callers
 * translate a `!ok` result into their own failure shape (429 response or
 * server-action state object).
 */
export async function enforceRateLimit(
  options: EnforceRateLimitOptions,
): Promise<EnforceResult> {
  const ipWindowMs = options.ipWindowMs ?? TEN_MINUTES_MS;
  const subjectWindowMs = options.subjectWindowMs ?? ipWindowMs;

  const rules: RateLimitRule[] = [
    {
      key: `app-action:${options.scope}:ip:${getClientIp(options.headers)}`,
      limit: options.ipLimit,
      windowMs: ipWindowMs,
    },
  ];

  if (options.subjectId && options.subjectLimit) {
    rules.push({
      key: `app-action:${options.scope}:subject:${hashIdentifier(options.subjectId)}`,
      limit: options.subjectLimit,
      windowMs: subjectWindowMs,
    });
  }

  for (const rule of rules) {
    const result = await consumeRateLimit(rule);
    if (!result.ok) {
      return {
        ok: false,
        retryAfterSeconds: result.retryAfterSeconds,
        message: RATE_LIMIT_MESSAGE,
      };
    }
  }

  return {
    ok: true,
    retryAfterSeconds: 0,
    message: "",
  };
}
