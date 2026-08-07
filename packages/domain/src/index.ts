// Pure, side-effect-free domain logic safe to import from anywhere,
// including client components. Server-only domains (database access,
// external APIs) live in their own subpath exports — e.g. "@urglowup/domain/booking"
// — and must NOT be re-exported here, since bundlers would then pull
// server-only dependencies (like the Postgres driver) into client bundles.

export * from "./permissions/role";
