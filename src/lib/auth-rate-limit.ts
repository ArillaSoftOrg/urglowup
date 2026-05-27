import { createHash } from "crypto";
import { db } from "./db";

type HeaderReader = Pick<Headers, "get">;

type RateLimitRule = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  ok: boolean;
  retryAfterSeconds: number;
};

const LOGIN_IP_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_EMAIL_WINDOW_MS = 10 * 60 * 1000;
const FORGOT_PASSWORD_WINDOW_MS = 60 * 60 * 1000;
const VERIFICATION_WINDOW_MS = 60 * 60 * 1000;

const AUTH_RATE_LIMIT_MESSAGE =
  "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
const AUTH_EMAIL_RATE_LIMIT_MESSAGE =
  "Bu adres için kısa süre içinde çok fazla istek alındı. Lütfen biraz sonra tekrar deneyin.";

export async function enforceLoginRateLimit(
  requestHeaders: HeaderReader,
  email: string,
) {
  return runRateLimitChecks([
    {
      key: buildScopedKey("login", "ip", getClientIp(requestHeaders)),
      limit: 10,
      windowMs: LOGIN_IP_WINDOW_MS,
    },
    {
      key: buildScopedKey("login", "email", hashIdentifier(email)),
      limit: 5,
      windowMs: LOGIN_EMAIL_WINDOW_MS,
    },
  ]);
}

export async function enforceForgotPasswordRateLimit(
  requestHeaders: HeaderReader,
  email: string,
) {
  return runRateLimitChecks([
    {
      key: buildScopedKey("forgot-password", "ip", getClientIp(requestHeaders)),
      limit: 5,
      windowMs: FORGOT_PASSWORD_WINDOW_MS,
    },
    {
      key: buildScopedKey("forgot-password", "email", hashIdentifier(email)),
      limit: 3,
      windowMs: FORGOT_PASSWORD_WINDOW_MS,
    },
  ]);
}

export async function enforceVerificationEmailRateLimit(
  requestHeaders: HeaderReader,
  email: string,
) {
  return runRateLimitChecks([
    {
      key: buildScopedKey("verification", "ip", getClientIp(requestHeaders)),
      limit: 5,
      windowMs: VERIFICATION_WINDOW_MS,
    },
    {
      key: buildScopedKey("verification", "email", hashIdentifier(email)),
      limit: 3,
      windowMs: VERIFICATION_WINDOW_MS,
    },
  ]);
}

function buildScopedKey(scope: string, dimension: string, value: string) {
  return `app-auth:${scope}:${dimension}:${value}`;
}

function getClientIp(headers: HeaderReader) {
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

function hashIdentifier(value: string) {
  return createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex")
    .slice(0, 24);
}

async function runRateLimitChecks(rules: RateLimitRule[]) {
  for (const rule of rules) {
    const result = await consumeRateLimit(rule);
    if (!result.ok) {
      return {
        ok: false as const,
        retryAfterSeconds: result.retryAfterSeconds,
        message: rule.key.includes(":email:")
          ? AUTH_EMAIL_RATE_LIMIT_MESSAGE
          : AUTH_RATE_LIMIT_MESSAGE,
      };
    }
  }

  return {
    ok: true as const,
    retryAfterSeconds: 0,
    message: "",
  };
}

async function consumeRateLimit(rule: RateLimitRule): Promise<RateLimitResult> {
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
