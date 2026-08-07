import fs from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

const cwd = process.cwd();
const env = { ...process.env };

function isValidUrl(value) {
  if (!value) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidOriginCsv(value) {
  if (!value) {
    return false;
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .every((origin) => {
      try {
        return new URL(origin).origin === origin;
      } catch {
        return false;
      }
    });
}

function isPositiveInteger(value) {
  if (!value) {
    return true;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1;
}

for (const fileName of [".env", ".env.local"]) {
  const filePath = path.join(cwd, fileName);
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const parsed = parse(fs.readFileSync(filePath));
  Object.assign(env, parsed);
}

const checks = [
  {
    key: "DATABASE_URL",
    required: true,
    validate: (value) => Boolean(value),
    hint: "Set your primary Postgres connection string.",
  },
  {
    key: "DIRECT_URL",
    required: false,
    validate: (value) => Boolean(value),
    hint: "Recommended for Prisma migrations and direct connections.",
  },
  {
    key: "BETTER_AUTH_SECRET",
    required: true,
    validate: (value) => typeof value === "string" && value.length >= 32,
    hint: "Use a random string with at least 32 characters.",
  },
  {
    key: "BETTER_AUTH_URL",
    required: false,
    validate: (value) => isValidUrl(value),
    hint: "Recommended to match NEXT_PUBLIC_APP_URL.",
  },
  {
    key: "NEXT_PUBLIC_APP_URL",
    required: true,
    validate: (value) => isValidUrl(value),
    hint: "Set the public app origin, for example https://yourdomain.com.",
  },
  {
    key: "RESEND_API_KEY",
    required: true,
    validate: (value) => Boolean(value),
    hint: "Required for verification and password-reset emails.",
  },
  {
    key: "EMAIL_FROM",
    required: true,
    validate: (value) => Boolean(value),
    hint: "Use a verified sender identity for production delivery.",
  },
  {
    key: "EMAIL_REPLY_TO",
    required: false,
    validate: (value) => !value || Boolean(value),
    hint: "Optional support reply inbox, for example support@yourdomain.com.",
  },
  {
    key: "CLOUDINARY_API_KEY",
    required: true,
    validate: (value) => Boolean(value),
    hint: "Required by the existing media pipeline.",
  },
  {
    key: "CLOUDINARY_API_SECRET",
    required: true,
    validate: (value) => Boolean(value),
    hint: "Required by the existing media pipeline.",
  },
  {
    key: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    required: true,
    validate: (value) => Boolean(value),
    hint: "Required by the existing media pipeline.",
  },
  {
    key: "OAUTH_TOKEN_ENCRYPTION_KEY",
    required: false,
    validate: (value) => /^[0-9a-fA-F]{64}$/.test(value ?? ""),
    hint: "Recommended before enabling Google Business Profile OAuth.",
  },
  {
    key: "BETTER_AUTH_TRUSTED_ORIGINS",
    required: false,
    validate: (value) => !value || isValidOriginCsv(value),
    hint: "Optional comma-separated origins for preview/admin aliases, for example https://app.example.com,https://admin.example.com.",
  },
  {
    key: "INTERNAL_API_SECRET",
    required: false,
    validate: (value) => Boolean(value),
    hint: "Recommended before enabling internal cron endpoints.",
  },
  {
    key: "MARKETPLACE_PUBLIC_LAUNCH_AT",
    required: false,
    validate: (value) =>
      !value ||
      (/^\d{4}-\d{2}-\d{2}T/.test(value) &&
        Number.isFinite(new Date(value).getTime())),
    hint:
      "Optional ISO timestamp for public launch, for example 2026-09-01T09:00:00+03:00.",
  },
  {
    key: "AUTH_RATE_LIMIT_LOGIN_IP",
    required: false,
    validate: isPositiveInteger,
    hint: "Optional positive integer override for login attempts per IP.",
  },
  {
    key: "AUTH_RATE_LIMIT_LOGIN_EMAIL",
    required: false,
    validate: isPositiveInteger,
    hint: "Optional positive integer override for login attempts per email.",
  },
  {
    key: "AUTH_RATE_LIMIT_FORGOT_PASSWORD_IP",
    required: false,
    validate: isPositiveInteger,
    hint: "Optional positive integer override for forgot-password attempts per IP.",
  },
  {
    key: "AUTH_RATE_LIMIT_FORGOT_PASSWORD_EMAIL",
    required: false,
    validate: isPositiveInteger,
    hint: "Optional positive integer override for forgot-password attempts per email.",
  },
  {
    key: "AUTH_RATE_LIMIT_RESET_PASSWORD_IP",
    required: false,
    validate: isPositiveInteger,
    hint: "Optional positive integer override for reset-password attempts per IP.",
  },
  {
    key: "AUTH_RATE_LIMIT_RESET_PASSWORD_TOKEN",
    required: false,
    validate: isPositiveInteger,
    hint: "Optional positive integer override for reset-password attempts per token.",
  },
  {
    key: "AUTH_RATE_LIMIT_VERIFICATION_IP",
    required: false,
    validate: isPositiveInteger,
    hint: "Optional positive integer override for verification attempts per IP.",
  },
  {
    key: "AUTH_RATE_LIMIT_VERIFICATION_EMAIL",
    required: false,
    validate: isPositiveInteger,
    hint: "Optional positive integer override for verification attempts per email.",
  },
];

const requiredFailures = [];
const recommendedFailures = [];

for (const check of checks) {
  const value = env[check.key];
  const valid = check.validate(value);

  if (!valid) {
    const target = check.required ? requiredFailures : recommendedFailures;
    target.push(`${check.key}: ${check.hint}`);
  }
}

const isProduction =
  env.VERCEL_ENV === "production" || env.NODE_ENV === "production";

if (isProduction) {
  if (!env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    requiredFailures.push(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY: Required in production for auth bot protection.",
    );
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    requiredFailures.push(
      "TURNSTILE_SECRET_KEY: Required in production for auth bot protection.",
    );
  }
}

const appUrl = env.NEXT_PUBLIC_APP_URL;
const authUrl = env.BETTER_AUTH_URL;
const urlMismatch =
  authUrl &&
  appUrl &&
  authUrl.replace(/\/$/, "") !== appUrl.replace(/\/$/, "");

console.log("Environment check");
console.log("=================");

if (requiredFailures.length === 0) {
  console.log("[OK] Required variables look valid.");
} else {
  console.log("[FAIL] Required variables need attention:");
  for (const failure of requiredFailures) {
    console.log(`- ${failure}`);
  }
}

if (recommendedFailures.length === 0) {
  console.log("[OK] Recommended variables look good.");
} else {
  console.log("[WARN] Recommended variables to review:");
  for (const failure of recommendedFailures) {
    console.log(`- ${failure}`);
  }
}

if (urlMismatch) {
  console.log(
    `[WARN] BETTER_AUTH_URL (${authUrl}) does not match NEXT_PUBLIC_APP_URL (${appUrl}).`,
  );
}

if (env.BETTER_AUTH_TRUSTED_ORIGINS) {
  console.log(
    `[INFO] BETTER_AUTH_TRUSTED_ORIGINS is set to ${env.BETTER_AUTH_TRUSTED_ORIGINS}.`,
  );
}

process.exit(requiredFailures.length === 0 ? 0 : 1);
