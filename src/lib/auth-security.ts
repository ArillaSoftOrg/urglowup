export function normalizeEmailForAuth(email: string) {
  return email.trim().toLowerCase();
}

export function maskEmailForLog(email: string) {
  const normalized = normalizeEmailForAuth(email);
  const [local, domain] = normalized.split("@");

  if (!local || !domain) {
    return "[redacted]";
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

export function redactAuthUrlForLog(url: string) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/");
    const resetPasswordIndex = segments.findIndex(
      (segment) => segment === "reset-password",
    );

    if (resetPasswordIndex >= 0 && segments[resetPasswordIndex + 1]) {
      segments[resetPasswordIndex + 1] = "[redacted]";
      parsed.pathname = segments.join("/");
    }

    for (const key of ["token", "callbackURL", "redirectTo"]) {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, "[redacted]");
      }
    }

    return parsed.toString();
  } catch {
    return "[redacted]";
  }
}

export function logAuthEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, unknown> = {},
) {
  const payload = {
    event,
    ...details,
  };

  if (level === "error") {
    console.error(`[${event}]`, payload);
    return;
  }

  if (level === "warn") {
    console.warn(`[${event}]`, payload);
    return;
  }

  console.log(`[${event}]`, payload);
}
