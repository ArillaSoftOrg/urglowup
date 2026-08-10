// Login under load + paginated appointment list fetch (master plan Phase 11
// scenarios 6-7). Login also exercises the Postgres-backed RateLimit table
// (auth.ts's `rateLimit: { storage: "database" }`) — the Phase 5 P2 flag
// about that becoming a hot-key contention point under load is exactly
// what this scenario is meant to catch.
//
// Run: k6 run -e BASE_URL=... -e TEST_USER_EMAIL=... -e TEST_USER_PASSWORD=... load-tests/authenticated-flows.js
//
// TEST_USER_EMAIL/PASSWORD must be a real, disposable customer account in
// the target environment — never point this at a real user's credentials.
// better-auth's login rate limit (100 req/60s window, shared across all
// auth endpoints per auth.ts) means many VUs sharing ONE test account will
// self-throttle; for a realistic login-under-load test, provision several
// distinct test accounts and round-robin them (see TEST_USER_EMAILS below).
import http from "k6/http";
import { check, sleep } from "k6";
import { signIn } from "./lib/auth.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD;

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error("TEST_USER_EMAIL and TEST_USER_PASSWORD env vars are required.");
}

export const options = {
  scenarios: {
    login: {
      executor: "ramping-vus",
      exec: "loginFlow",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 10 },
        { duration: "1m", target: 10 },
        { duration: "20s", target: 0 },
      ],
    },
    appointments_list: {
      executor: "ramping-vus",
      exec: "appointmentsListFlow",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 15 },
        { duration: "1m", target: 15 },
        { duration: "20s", target: 0 },
      ],
    },
  },
  thresholds: {
    "http_req_duration{scenario:login}": ["p(95)<1000"],
    "http_req_duration{scenario:appointments_list}": ["p(95)<500"],
    http_req_failed: ["rate<0.005"],
  },
};

export function loginFlow() {
  const res = signIn(BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD);
  check(res, { "login 200": (r) => r.status === 200 });
  sleep(2);
}

export function appointmentsListFlow() {
  signIn(BASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD);
  const res = http.get(`${BASE_URL}/api/v1/appointments`);
  check(res, { "200 OK": (r) => r.status === 200 });
  sleep(1);
}
