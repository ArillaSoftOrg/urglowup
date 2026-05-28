/**
 * Email configuration bootstrap and validation.
 *
 * This module should be imported once at app startup to validate
 * email configuration early and log any issues.
 */

import { validateEmailConfig } from "./email-diagnostics";

let bootstrapped = false;

export function bootstrapEmailConfig() {
  if (bootstrapped) return;
  bootstrapped = true;

  const diagnostic = validateEmailConfig();

  if (diagnostic.errors.length > 0) {
    console.error("[email-bootstrap:errors]", {
      count: diagnostic.errors.length,
      errors: diagnostic.errors,
    });
  }

  if (diagnostic.warnings.length > 0) {
    console.warn("[email-bootstrap:warnings]", {
      count: diagnostic.warnings.length,
      warnings: diagnostic.warnings,
    });
  }

  if (diagnostic.isValid) {
    console.log("[email-bootstrap:success] Email configuration is valid");
  }
}
