# Load tests (Phase 11)

k6 scripts validating the master implementation plan's launch metrics against a
staging environment. Run from a single region close to the target Postgres
instance — measuring cross-region network latency instead of app latency
produces misleading numbers.

## Install k6

Not installed in this dev environment (no `choco`/`winget` invoked without
asking first, and downloading a third-party binary is a step up from editing
code). Install however you prefer:

- Windows: `winget install k6` or `choco install k6` or download the release
  zip from https://github.com/grafana/k6/releases
- macOS: `brew install k6`
- Linux: see https://grafana.com/docs/k6/latest/set-up/install-k6/

## Scripts

| Script | Covers | Auth |
|---|---|---|
| `marketplace.js` | browse, filtered search, business detail, availability | none |
| `authenticated-flows.js` | login under load, paginated appointment list | test account |
| `booking-storm.js` | **the hard gate**: concurrent booking requests at the same slot, asserts exactly one success | multiple distinct test accounts |

None of these depend on seed/fixture data checked into the repo — every
script takes the business/service/user identifiers it needs as environment
variables, resolved against whatever real data exists in the target
environment. Never point `TEST_USER_*` at a real customer's credentials;
provision disposable test accounts.

## Running

```sh
# Marketplace browsing/search/detail/availability
k6 run -e BASE_URL=https://staging.urglowup.com \
  -e BUSINESS_SLUG=some-real-slug \
  -e SERVICE_ID=some-real-service-id \
  load-tests/marketplace.js

# Login + appointments list
k6 run -e BASE_URL=https://staging.urglowup.com \
  -e TEST_USER_EMAIL=loadtest@example.com \
  -e TEST_USER_PASSWORD=... \
  load-tests/authenticated-flows.js

# Booking storm — the zero-double-bookings gate
k6 run -e BASE_URL=https://staging.urglowup.com \
  -e BUSINESS_ID=... -e SERVICE_ID=... -e DATE=2026-09-01 -e TIME=14:00 \
  -e TEST_USER_CREDENTIALS="a@test.com:pw,b@test.com:pw,c@test.com:pw,d@test.com:pw,e@test.com:pw" \
  load-tests/booking-storm.js
```

## Launch metrics (from the master plan)

- p95 latency < 500ms for cached reads, < 1000ms for availability/booking writes.
- Error rate < 0.5% under target load.
- **Zero double bookings** in `booking-storm.js` — hard gate, not a percentage.
  Check the run's `booking_conflicts`/`booking_unexpected_failures` counts, not
  just `booking_successes==1` — a run where every request failed for an
  unrelated reason (bad DATE/TIME outside working hours, expired test
  accounts) would still pass a naive "only one success" check vacuously.
- DB connection count stays within the provider's limit with headroom —
  observe this on the Postgres/Neon side during the run, not from k6 output
  (validates the Phase 5 pool-sizing fix in packages/db/src/client.ts).

Re-run after any change to Phase 1 (booking) or Phase 5 (indexes/pooling) code.

## Not yet done

- No CI wiring — these are meant to run against staging on demand, not on
  every PR (they need real data and take minutes, unlike the domain test
  suite that runs in CI on every push).
- No automated Postgres connection-count capture — read it manually from the
  provider dashboard during a run until this is worth automating.
