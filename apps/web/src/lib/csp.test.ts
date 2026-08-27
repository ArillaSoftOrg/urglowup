import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { resolveCspHeaders } from "./csp";

const originalStrict = process.env.CSP_STRICT_ENFORCE;
const originalReportOnly = process.env.CSP_REPORT_ONLY;
const originalReportUri = process.env.CSP_REPORT_URI;

beforeEach(() => {
  delete process.env.CSP_STRICT_ENFORCE;
  delete process.env.CSP_REPORT_ONLY;
  delete process.env.CSP_REPORT_URI;
});

afterEach(() => {
  restoreEnv("CSP_STRICT_ENFORCE", originalStrict);
  restoreEnv("CSP_REPORT_ONLY", originalReportOnly);
  restoreEnv("CSP_REPORT_URI", originalReportUri);
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

test("default rollout enforces permissive CSP and reports strict CSP", () => {
  const { strict, responseHeaders } = resolveCspHeaders("abc123");
  const strictScriptSrc = strict
    .split("; ")
    .find((directive) => directive.startsWith("script-src"));

  assert.equal(responseHeaders.length, 2);
  assert.equal(responseHeaders[0].key, "Content-Security-Policy");
  assert.match(responseHeaders[0].value, /'unsafe-inline'/);
  assert.equal(responseHeaders[1].key, "Content-Security-Policy-Report-Only");
  assert.equal(responseHeaders[1].value, strict);
  assert.match(strict, /'nonce-abc123'/);
  assert.ok(strictScriptSrc);
  assert.doesNotMatch(strictScriptSrc, /'unsafe-inline'/);
});

test("strict enforce emits only the strict enforced header", () => {
  process.env.CSP_STRICT_ENFORCE = "true";

  const { strict, responseHeaders } = resolveCspHeaders("abc123");

  assert.deepEqual(responseHeaders, [
    { key: "Content-Security-Policy", value: strict },
  ]);
});

test("report-only rollback emits no enforced CSP header", () => {
  process.env.CSP_REPORT_ONLY = "true";

  const { responseHeaders } = resolveCspHeaders("abc123");

  assert.equal(responseHeaders.length, 1);
  assert.equal(responseHeaders[0].key, "Content-Security-Policy-Report-Only");
});

test("appends report-uri when configured", () => {
  process.env.CSP_REPORT_URI = "https://csp.example.test/report";

  const { strict } = resolveCspHeaders("abc123");

  assert.match(strict, /report-uri https:\/\/csp\.example\.test\/report/);
});
