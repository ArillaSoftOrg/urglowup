import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { isInternalRequestAuthorized } from "./internal-auth";

const SECRET = "test-secret-value-1234567890";
const originalSecret = process.env.INTERNAL_API_SECRET;

beforeEach(() => {
  delete process.env.INTERNAL_API_SECRET;
});

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.INTERNAL_API_SECRET;
  } else {
    process.env.INTERNAL_API_SECRET = originalSecret;
  }
});

function requestWithHeaders(headers: Record<string, string>): Request {
  return new Request("https://example.test/api/internal/whatever", { headers });
}

test("denies every request when INTERNAL_API_SECRET is not configured (fail closed)", () => {
  assert.equal(isInternalRequestAuthorized(requestWithHeaders({})), false);
  assert.equal(
    isInternalRequestAuthorized(requestWithHeaders({ "x-internal-secret": "anything" })),
    false,
  );
});

test("denies a request with no secret header", () => {
  process.env.INTERNAL_API_SECRET = SECRET;
  assert.equal(isInternalRequestAuthorized(requestWithHeaders({})), false);
});

test("denies a request with the wrong secret", () => {
  process.env.INTERNAL_API_SECRET = SECRET;
  assert.equal(
    isInternalRequestAuthorized(requestWithHeaders({ "x-internal-secret": "wrong-value" })),
    false,
  );
});

test("accepts a request with the correct secret", () => {
  process.env.INTERNAL_API_SECRET = SECRET;
  assert.equal(
    isInternalRequestAuthorized(requestWithHeaders({ "x-internal-secret": SECRET })),
    true,
  );
});

test("a spoofed Vercel Cron User-Agent alone cannot authorize a request — the regression this fix closes", () => {
  process.env.INTERNAL_API_SECRET = SECRET;
  assert.equal(
    isInternalRequestAuthorized(requestWithHeaders({ "user-agent": "vercel-cron/1.0" })),
    false,
    "a request with no secret header must be denied even if it claims to be Vercel Cron via User-Agent",
  );
});

test("a spoofed User-Agent combined with a wrong secret is still denied", () => {
  process.env.INTERNAL_API_SECRET = SECRET;
  assert.equal(
    isInternalRequestAuthorized(
      requestWithHeaders({ "user-agent": "vercel-cron/1.0", "x-internal-secret": "wrong" }),
    ),
    false,
  );
});
