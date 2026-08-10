// Marketplace browsing, filtered search, business detail, and availability
// checks — the four highest-traffic read scenarios (master plan Phase 11).
//
// Run: k6 run -e BASE_URL=https://staging.urglowup.com -e BUSINESS_SLUG=some-salon -e SERVICE_ID=xyz load-tests/marketplace.js
//
// BUSINESS_SLUG/SERVICE_ID must belong to a real ACTIVE_MARKETPLACE
// business in the target environment — there's no seed/fixture data
// checked into the repo, so these have to be supplied per-environment.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const BUSINESS_SLUG = __ENV.BUSINESS_SLUG;
const SERVICE_ID = __ENV.SERVICE_ID;

if (!BUSINESS_SLUG || !SERVICE_ID) {
  throw new Error(
    "BUSINESS_SLUG and SERVICE_ID env vars are required — point them at a real business/service in the target environment.",
  );
}

export const options = {
  scenarios: {
    marketplace_browse: {
      executor: "ramping-vus",
      exec: "browseMarketplace",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 },
        { duration: "2m", target: 50 },
        { duration: "30s", target: 0 },
      ],
    },
    filtered_search: {
      executor: "ramping-vus",
      exec: "filteredSearch",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 30 },
        { duration: "2m", target: 30 },
        { duration: "30s", target: 0 },
      ],
    },
    business_detail: {
      executor: "ramping-vus",
      exec: "businessDetail",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 40 },
        { duration: "2m", target: 40 },
        { duration: "30s", target: 0 },
      ],
    },
    availability_check: {
      executor: "ramping-vus",
      exec: "availabilityCheck",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 },
        { duration: "2m", target: 20 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    // Cached/list reads — p95 < 500ms per the master plan's launch gate.
    "http_req_duration{scenario:marketplace_browse}": ["p(95)<500"],
    "http_req_duration{scenario:filtered_search}": ["p(95)<500"],
    "http_req_duration{scenario:business_detail}": ["p(95)<500"],
    // Availability is always a live, uncached DB read — allowed more headroom,
    // still under the 1000ms write-path gate.
    "http_req_duration{scenario:availability_check}": ["p(95)<1000"],
    http_req_failed: ["rate<0.005"], // <0.5% error rate, all scenarios combined
  },
};

export function browseMarketplace() {
  const res = http.get(`${BASE_URL}/api/v1/businesses?sort=recommended&limit=20`);
  check(res, { "200 OK": (r) => r.status === 200 });
  sleep(1);
}

export function filteredSearch() {
  const queries = ["saç", "cilt bakımı", "manikür", "lazer epilasyon"];
  const q = queries[Math.floor(Math.random() * queries.length)];
  const res = http.get(`${BASE_URL}/api/v1/businesses?q=${encodeURIComponent(q)}&limit=20`);
  check(res, { "200 OK": (r) => r.status === 200 });
  sleep(1);
}

export function businessDetail() {
  const res = http.get(`${BASE_URL}/api/v1/businesses/${BUSINESS_SLUG}`);
  check(res, { "200 OK": (r) => r.status === 200 });
  sleep(1);
}

export function availabilityCheck() {
  const date = new Date();
  date.setDate(date.getDate() + 1 + Math.floor(Math.random() * 7));
  const dateStr = date.toISOString().slice(0, 10);

  const res = http.get(
    `${BASE_URL}/api/v1/businesses/${BUSINESS_SLUG}/availability?serviceId=${SERVICE_ID}&date=${dateStr}`,
  );
  check(res, { "200 OK": (r) => r.status === 200 });
  sleep(1);
}
