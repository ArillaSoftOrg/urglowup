import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveClientIp } from "./client-ip";

function headers(values: Record<string, string>) {
  return new Headers(values);
}

test("prefers x-real-ip over spoofable x-forwarded-for", () => {
  assert.equal(
    resolveClientIp(
      headers({
        "x-forwarded-for": "198.51.100.10, 203.0.113.20",
        "x-real-ip": "203.0.113.5",
      }),
    ),
    "203.0.113.5",
  );
});

test("falls back to first x-forwarded-for hop when x-real-ip is absent", () => {
  assert.equal(
    resolveClientIp(headers({ "x-forwarded-for": "198.51.100.10, 203.0.113.20" })),
    "198.51.100.10",
  );
});

test("returns null when no client IP headers are available", () => {
  assert.equal(resolveClientIp(headers({})), null);
});
