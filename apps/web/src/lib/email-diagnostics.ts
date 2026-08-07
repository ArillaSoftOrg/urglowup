/**
 * Email diagnostics and validation utilities.
 * Helps identify issues with Resend integration and email configuration.
 */

import { env } from "./env";

interface EmailDiagnostic {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  timestamp: string;
}

/**
 * Validates email configuration at startup.
 * This helps catch misconfigured environments before users encounter failures.
 */
export function validateEmailConfig(): EmailDiagnostic {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check RESEND_API_KEY
  if (!env.RESEND_API_KEY || env.RESEND_API_KEY.length === 0) {
    errors.push(
      "RESEND_API_KEY is not configured. Email delivery will fail."
    );
  } else if (!env.RESEND_API_KEY.startsWith("re_")) {
    warnings.push(
      "RESEND_API_KEY does not look like a valid Resend API key (should start with 're_')"
    );
  }

  // Check EMAIL_FROM
  if (!env.EMAIL_FROM || env.EMAIL_FROM.length === 0) {
    errors.push("EMAIL_FROM is not configured. Email delivery will fail.");
  } else {
    const emailAddress = extractEmailAddress(env.EMAIL_FROM);

    if (!emailAddress) {
      errors.push(
        "EMAIL_FROM could not be parsed. Use format: 'Name <email@example.com>' or 'email@example.com'"
      );
    } else if (!isValidEmailAddress(emailAddress)) {
      errors.push(
        `EMAIL_FROM contains invalid email address: '${emailAddress}'`
      );
    } else if (env.RESEND_API_KEY?.startsWith("re_")) {
      // Only warn about sandbox during production key setup
      if (emailAddress.includes("@resend.dev")) {
        warnings.push(
          "EMAIL_FROM uses Resend sandbox domain (@resend.dev). This is only for testing. For production, use a verified custom domain."
        );
      }
    }
  }

  // Check BETTER_AUTH_URL for callback URLs
  if (!env.BETTER_AUTH_URL && !env.NEXT_PUBLIC_APP_URL) {
    errors.push(
      "Neither BETTER_AUTH_URL nor NEXT_PUBLIC_APP_URL is configured. Email verification links will not work."
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Simple email validation.
 */
function isValidEmailAddress(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function extractEmailAddress(value: string): string | undefined {
  const trimmed = value.trim();

  if (trimmed.includes("<") || trimmed.includes(">")) {
    const displayNameMatch = trimmed.match(/^[^<>]*<\s*([^<>]+?)\s*>$/);
    return displayNameMatch?.[1]?.trim();
  }

  return trimmed;
}

/**
 * Types of email delivery failures for diagnosis.
 */
export type EmailFailureType =
  | "MISSING_ENV"
  | "INVALID_EMAIL"
  | "RESEND_API_ERROR"
  | "RESEND_RATE_LIMIT"
  | "RESEND_VALIDATION"
  | "UNKNOWN";

/**
 * Diagnoses a Resend error response.
 */
export function diagnoseResendError(error: unknown): {
  type: EmailFailureType;
  message: string;
  resendCode?: string;
} {
  if (!error) {
    return { type: "UNKNOWN", message: "Unknown error" };
  }

  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;

    // Check for Resend-specific error structure
    if ("message" in err && typeof err.message === "string") {
      const msg = err.message;

      if (msg.includes("Missing 'from' email header")) {
        return {
          type: "MISSING_ENV",
          message: "EMAIL_FROM not configured or invalid",
        };
      }

      if (
        msg.includes("invalid_request_url_length") ||
        msg.includes("invalid email")
      ) {
        return {
          type: "INVALID_EMAIL",
          message: "Invalid email address provided",
        };
      }

      if (msg.includes("rate_limit")) {
        return {
          type: "RESEND_RATE_LIMIT",
          message: "Rate limit exceeded. Too many emails sent.",
          resendCode: "rate_limit",
        };
      }

      if (msg.includes("validation")) {
        return {
          type: "RESEND_VALIDATION",
          message: `Validation error: ${msg}`,
        };
      }

      if (msg.includes("Unauthorized") || msg.includes("invalid api key")) {
        return {
          type: "MISSING_ENV",
          message: "RESEND_API_KEY is invalid or missing",
        };
      }

      return {
        type: "RESEND_API_ERROR",
        message: msg,
      };
    }
  }

  return {
    type: "UNKNOWN",
    message: `Error: ${String(error)}`,
  };
}

/**
 * Structured logging for email send events.
 * Use this instead of console.log to make failures easier to track.
 */
export function logEmailEvent(event: {
  type: "send_attempt" | "send_success" | "send_failure";
  to: string;
  subject: string;
  template?: string;
  errorType?: EmailFailureType;
  errorMessage?: string;
  resendMessageId?: string;
  timestamp?: string;
}) {
  const timestamp = event.timestamp || new Date().toISOString();

  // In production, these would go to a logging service (Sentry, LogRocket, etc.)
  // For now, console output is structured and redacts secrets.
  const baseLog = {
    type: event.type,
    to: redactEmail(event.to),
    subject: event.subject.substring(0, 50),
    template: event.template,
    timestamp,
  };

  switch (event.type) {
    case "send_attempt":
      console.log("[email:send_attempt]", JSON.stringify(baseLog));
      break;

    case "send_success":
      console.log(
        "[email:send_success]",
        JSON.stringify({
          ...baseLog,
          resendMessageId: event.resendMessageId,
        })
      );
      break;

    case "send_failure":
      console.error(
        "[email:send_failure]",
        JSON.stringify({
          ...baseLog,
          errorType: event.errorType,
          errorMessage: event.errorMessage?.substring(0, 200),
        })
      );
      break;
  }
}

/**
 * Redact email for logging to avoid exposing user emails in plaintext logs.
 */
function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "[invalid-email]";

  const visibleLength = Math.max(1, Math.ceil(local.length / 3));
  const redacted = local.substring(0, visibleLength) + "*".repeat(3);
  return `${redacted}@${domain}`;
}
