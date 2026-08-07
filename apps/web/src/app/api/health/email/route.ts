import { validateEmailConfig } from "@/lib/email-diagnostics";
import type { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

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
 * Authentication: requires x-internal-secret header if INTERNAL_API_SECRET is configured.
 */
export async function GET(request: NextRequest) {
  // Optional: Require a secret for security via x-internal-secret header.
  const expectedSecret = process.env.INTERNAL_API_SECRET;
  if (expectedSecret) {
    const provided = request.headers.get("x-internal-secret");
    if (!provided) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    try {
      const a = Buffer.from(expectedSecret, "utf8");
      const b = Buffer.from(provided, "utf8");
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return Response.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } catch {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
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
