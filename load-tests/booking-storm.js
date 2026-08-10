// The single hard launch gate from the master plan: fire many concurrent
// booking requests at the EXACT SAME slot and assert zero double bookings.
// packages/domain/src/booking/create-appointment.test.ts already proves
// this at the function level (two different customers, Promise.all,
// against a real Postgres advisory lock + partial unique index); this
// script re-proves it through the real HTTP path (auth middleware, API
// route, rate limiter, connection pool) at realistic concurrency, which is
// the part a unit test can't cover.
//
// Run: k6 run \
//   -e BASE_URL=https://staging.urglowup.com \
//   -e BUSINESS_ID=... -e SERVICE_ID=... -e DATE=2026-09-01 -e TIME=14:00 \
//   -e TEST_USER_CREDENTIALS="a@test.com:pw1,b@test.com:pw2,c@test.com:pw3,..." \
//   load-tests/booking-storm.js
//
// TEST_USER_CREDENTIALS needs one DISTINCT customer account per VU (see
// `vus` below) — reusing one account across VUs would make every request
// past the first fail with DUPLICATE_CUSTOMER_BOOKING instead of the
// SLOT_TAKEN race this test exists to catch, silently weakening the gate.
// DATE must be far enough out to clear MIN_ADVANCE_HOURS/MAX_ADVANCE_DAYS
// (packages/domain/src/booking/constants.ts) and the slot must be within
// the business's working hours for that day, or every request will fail
// for an unrelated reason (no slot to contend over) and the "zero double
// bookings" assertion becomes vacuously true — check the run's failure
// reasons, not just the success count, before trusting a green result.
import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";
import { signIn } from "./lib/auth.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const BUSINESS_ID = __ENV.BUSINESS_ID;
const SERVICE_ID = __ENV.SERVICE_ID;
const DATE = __ENV.DATE;
const TIME = __ENV.TIME || "14:00";
const CREDENTIALS = (__ENV.TEST_USER_CREDENTIALS || "")
  .split(",")
  .map((pair) => pair.trim())
  .filter(Boolean)
  .map((pair) => {
    const [email, password] = pair.split(":");
    return { email, password };
  });

if (!BUSINESS_ID || !SERVICE_ID || !DATE) {
  throw new Error("BUSINESS_ID, SERVICE_ID, and DATE env vars are required.");
}
if (CREDENTIALS.length < 2) {
  throw new Error(
    "TEST_USER_CREDENTIALS needs at least 2 distinct 'email:password' pairs (comma-separated) to exercise a real cross-customer race.",
  );
}

const bookingConflicts = new Counter("booking_conflicts");
const bookingSuccesses = new Counter("booking_successes");
const bookingUnexpectedFailures = new Counter("booking_unexpected_failures");

export const options = {
  // constant-vus, not ramping: this scenario's entire point is simultaneity,
  // not sustained throughput — one VU per test account, one iteration each.
  scenarios: {
    booking_storm: {
      executor: "shared-iterations",
      vus: CREDENTIALS.length,
      iterations: CREDENTIALS.length,
      maxDuration: "30s",
    },
  },
  thresholds: {
    // The actual gate: exactly one booking_successes across the whole run.
    booking_successes: ["count==1"],
    booking_unexpected_failures: ["count==0"],
  },
};

export default function bookingStorm() {
  const creds = CREDENTIALS[(__VU - 1) % CREDENTIALS.length];
  signIn(BASE_URL, creds.email, creds.password);

  const res = http.post(
    `${BASE_URL}/api/v1/appointments`,
    JSON.stringify({
      businessId: BUSINESS_ID,
      serviceId: SERVICE_ID,
      date: DATE,
      time: TIME,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        // Deliberately NOT setting Idempotency-Key here — each VU is a
        // distinct customer making a genuinely distinct request; the point
        // is to race the slot-uniqueness check, not the idempotency path
        // (that's already covered by the "retried request replays" domain
        // test).
      },
    },
  );

  if (res.status === 201) {
    bookingSuccesses.add(1);
    check(res, { "booking created": (r) => JSON.parse(r.body).appointmentId !== undefined });
  } else if (res.status === 409) {
    bookingConflicts.add(1);
  } else {
    bookingUnexpectedFailures.add(1);
    console.error(`Unexpected booking response: ${res.status} ${res.body}`);
  }
}
