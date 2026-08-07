import {
  consumeRateLimit,
  getClientIp,
  hashIdentifier,
  readPositiveIntEnv,
  type HeaderReader,
  type RateLimitRule,
} from "./rate-limit";

const LOGIN_IP_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_EMAIL_WINDOW_MS = 10 * 60 * 1000;
const FORGOT_PASSWORD_WINDOW_MS = 60 * 60 * 1000;
const RESET_PASSWORD_WINDOW_MS = 60 * 60 * 1000;
const VERIFICATION_WINDOW_MS = 60 * 60 * 1000;

const LOGIN_IP_LIMIT = readPositiveIntEnv("AUTH_RATE_LIMIT_LOGIN_IP", 30);
const LOGIN_EMAIL_LIMIT = readPositiveIntEnv("AUTH_RATE_LIMIT_LOGIN_EMAIL", 5);
const FORGOT_PASSWORD_IP_LIMIT = readPositiveIntEnv(
  "AUTH_RATE_LIMIT_FORGOT_PASSWORD_IP",
  30,
);
const FORGOT_PASSWORD_EMAIL_LIMIT = readPositiveIntEnv(
  "AUTH_RATE_LIMIT_FORGOT_PASSWORD_EMAIL",
  3,
);
const RESET_PASSWORD_IP_LIMIT = readPositiveIntEnv(
  "AUTH_RATE_LIMIT_RESET_PASSWORD_IP",
  30,
);
const RESET_PASSWORD_TOKEN_LIMIT = readPositiveIntEnv(
  "AUTH_RATE_LIMIT_RESET_PASSWORD_TOKEN",
  5,
);
const VERIFICATION_IP_LIMIT = readPositiveIntEnv(
  "AUTH_RATE_LIMIT_VERIFICATION_IP",
  30,
);
const VERIFICATION_EMAIL_LIMIT = readPositiveIntEnv(
  "AUTH_RATE_LIMIT_VERIFICATION_EMAIL",
  3,
);

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
      limit: LOGIN_IP_LIMIT,
      windowMs: LOGIN_IP_WINDOW_MS,
    },
    {
      key: buildScopedKey("login", "email", hashIdentifier(email)),
      limit: LOGIN_EMAIL_LIMIT,
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
      limit: FORGOT_PASSWORD_IP_LIMIT,
      windowMs: FORGOT_PASSWORD_WINDOW_MS,
    },
    {
      key: buildScopedKey("forgot-password", "email", hashIdentifier(email)),
      limit: FORGOT_PASSWORD_EMAIL_LIMIT,
      windowMs: FORGOT_PASSWORD_WINDOW_MS,
    },
  ]);
}

export async function enforceResetPasswordRateLimit(
  requestHeaders: HeaderReader,
  token: string,
) {
  return runRateLimitChecks([
    {
      key: buildScopedKey("reset-password", "ip", getClientIp(requestHeaders)),
      limit: RESET_PASSWORD_IP_LIMIT,
      windowMs: RESET_PASSWORD_WINDOW_MS,
    },
    {
      key: buildScopedKey("reset-password", "token", hashIdentifier(token)),
      limit: RESET_PASSWORD_TOKEN_LIMIT,
      windowMs: RESET_PASSWORD_WINDOW_MS,
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
      limit: VERIFICATION_IP_LIMIT,
      windowMs: VERIFICATION_WINDOW_MS,
    },
    {
      key: buildScopedKey("verification", "email", hashIdentifier(email)),
      limit: VERIFICATION_EMAIL_LIMIT,
      windowMs: VERIFICATION_WINDOW_MS,
    },
  ]);
}

function buildScopedKey(scope: string, dimension: string, value: string) {
  return `app-auth:${scope}:${dimension}:${value}`;
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
