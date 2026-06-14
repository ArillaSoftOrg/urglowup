import { validateEmailConfig } from "@/lib/email-diagnostics";
import { env } from "@/lib/env";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }

  const diagnostic = validateEmailConfig();

  return Response.json({
    isValid: diagnostic.isValid,
    timestamp: diagnostic.timestamp,
    errors: diagnostic.errors,
    warnings: diagnostic.warnings,
    config: {
      resendApiKeySet: Boolean(env.RESEND_API_KEY),
      resendApiKeyStartsWith: env.RESEND_API_KEY?.substring(0, 3),
      emailFromSet: Boolean(env.EMAIL_FROM),
      emailFrom: env.EMAIL_FROM,
      betterAuthUrl: env.BETTER_AUTH_URL,
      appUrl: env.NEXT_PUBLIC_APP_URL,
    },
  });
}
