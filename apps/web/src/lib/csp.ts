const CSP_HEADER = "Content-Security-Policy";
const CSP_REPORT_ONLY_HEADER = "Content-Security-Policy-Report-Only";

export type CspHeader = { key: string; value: string };

export function generateCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64");
}

function scriptSrc(mode: "permissive" | "strict", nonce: string, isDev: boolean): string {
  const inline = mode === "permissive" ? "'unsafe-inline'" : `'nonce-${nonce}'`;
  const evalSrc = isDev ? " 'unsafe-eval'" : "";
  return `script-src 'self' ${inline}${evalSrc} https://challenges.cloudflare.com https://maps.googleapis.com https://maps.gstatic.com`;
}

function buildPolicy(mode: "permissive" | "strict", nonce: string, isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    scriptSrc(mode, nonce, isDev),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://img.clerk.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com https://*.googleusercontent.com",
    "font-src 'self' data:",
    "connect-src 'self' https://maps.googleapis.com https://*.googleapis.com https://challenges.cloudflare.com https://res.cloudinary.com",
    "frame-src https://challenges.cloudflare.com https://www.google.com https://maps.google.com",
    "media-src 'self' https://res.cloudinary.com blob: data:",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ];

  const reportUri = process.env.CSP_REPORT_URI?.trim();
  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  return directives.join("; ");
}

export function buildPermissiveCsp(nonce: string, isDev: boolean): string {
  return buildPolicy("permissive", nonce, isDev);
}

export function buildStrictCsp(nonce: string, isDev: boolean): string {
  return buildPolicy("strict", nonce, isDev);
}

export function resolveCspHeaders(nonce: string): {
  strict: string;
  responseHeaders: CspHeader[];
} {
  const isDev = process.env.NODE_ENV === "development";
  const permissive = buildPermissiveCsp(nonce, isDev);
  const strict = buildStrictCsp(nonce, isDev);

  const enforceStrict = process.env.CSP_STRICT_ENFORCE === "true";
  const emergencyReportOnly = process.env.CSP_REPORT_ONLY === "true";
  const enforcedPolicy = enforceStrict ? strict : permissive;

  if (emergencyReportOnly) {
    return {
      strict,
      responseHeaders: [{ key: CSP_REPORT_ONLY_HEADER, value: enforcedPolicy }],
    };
  }

  if (enforceStrict) {
    return {
      strict,
      responseHeaders: [{ key: CSP_HEADER, value: strict }],
    };
  }

  return {
    strict,
    responseHeaders: [
      { key: CSP_HEADER, value: permissive },
      { key: CSP_REPORT_ONLY_HEADER, value: strict },
    ],
  };
}
