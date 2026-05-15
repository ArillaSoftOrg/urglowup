import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  // Optional — existing
  ADMIN_EMAILS: z.string().optional(),
  // Google Business Profile OAuth (Phase 15+)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  GOOGLE_BUSINESS_PROFILE_SCOPES: z.string().optional(),
  // 64 hex chars = 32 bytes for AES-256-GCM OAuth token encryption
  OAUTH_TOKEN_ENCRYPTION_KEY: z
    .string()
    .regex(
      /^[0-9a-fA-F]{64}$/,
      "OAUTH_TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    )
    .optional(),
  // Internal cron / cleanup secret
  INTERNAL_API_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
