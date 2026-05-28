import { validateEmailConfig } from "@/lib/email-diagnostics";
import type { NextRequest } from "next/server";

/**
 * Email health check endpoint.
 *
 * Returns diagnostics about email configuration without exposing secrets.
 *
 * Example response:
 * {
 *   "status": "ok" | "misconfigured" | "warning",
 *   "errors": [...],
 *   "warnings": [...],
 *   "timestamp": "2026-05-28T..."
 * }
 *
 * This endpoint is public (no auth required) but returns only non-sensitive info.
 */
export async function GET(request: NextRequest) {
  // Optional: Require a simple secret for security.
  // Remove this check if you want completely public diagnostics.
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.INTERNAL_API_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const diagnostic = validateEmailConfig();

  return Response.json({
    status: diagnostic.isValid ? "ok" : diagnostic.errors.length > 0 ? "misconfigured" : "warning",
    isConfigured: diagnostic.isValid,
    errorCount: diagnostic.errors.length,
    warningCount: diagnostic.warnings.length,
    errors: diagnostic.errors,
    warnings: diagnostic.warnings,
    timestamp: diagnostic.timestamp,
    note: "Email configuration validation. Errors will prevent email delivery. Warnings are for info only.",
  });
}
