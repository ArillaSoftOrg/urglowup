import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { config } from "dotenv";
import type { PrismaClient } from "@urglowup/db";
import type { toBusinessDetailDTO as ToBusinessDetailDTO } from "./dto";

// Integration test against a real database (see DATABASE_URL) — creates its
// own throwaway fixture and deletes it afterwards.
//
// Queries the fixture directly (mirroring packages/domain/src/businesses/queries.ts's
// fetchBusinessBySlug include shape) instead of calling getBusinessBySlug
// itself: that function lives behind @urglowup/domain/businesses's barrel,
// which has `import "server-only"` — fine inside Next's server bundling
// context, but it throws when loaded under a plain tsx/node:test run
// (same class of issue documented in packages/domain's own test files,
// which route around it by importing individual files, not barrels; no
// equivalent non-barrel subpath exists for apps/web to reach into a
// different workspace package). This test's actual target is
// toBusinessDetailDTO's field-stripping behavior, not getBusinessBySlug's
// caching — querying directly is also a tighter fit for that.
//
// apps/web isn't an ESM package ("type": "module" isn't set, unlike
// packages/domain), so top-level await — needed to load env vars via
// dotenv's config() before the @urglowup/db module initializes its client —
// isn't available at the top level under esbuild's CJS transform. Deferring
// the imports into before() (an async function body, not top-level) sidesteps
// that restriction while still guaranteeing config() has already run.

const ALLOWED_KEYS = new Set([
  "id",
  "name",
  "slug",
  "description",
  "coverImageUrl",
  "logoUrl",
  "address",
  "city",
  "district",
  "latitude",
  "longitude",
  "categories",
  "services",
  "professionals",
  "hours",
  "reviews",
  "reviewCount",
  "appointmentCount",
]);

// Fields the old, un-mapped GET /api/v1/businesses/:slug response used to
// leak — internal/admin-only, never meant for a public API consumer.
const FORBIDDEN_KEYS = [
  "ownerId",
  "owner",
  "geocodingStatus",
  "geocodingError",
  "geocodedAt",
  "googlePlaceId",
  "googlePlaceMatchStatus",
  "googlePlaceMatchAttemptedAt",
  "googlePlaceMatchError",
  "ownershipStatus",
  "marketplaceJoinedAt",
  "isEditoriallyRecommended",
  "editorialRecommendationRank",
  "status",
  "isMarketplaceVisible",
  "createdAt",
  "updatedAt",
  "_count",
];

function fetchBusinessBySlug(db: PrismaClient, slug: string) {
  return db.business.findUnique({
    where: { slug },
    include: {
      categories: { include: { category: true } },
      services: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      media: {
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        include: {
          relatedService: {
            select: {
              id: true,
              name: true,
              durationMinutes: true,
              price: true,
              priceType: true,
              salePrice: true,
              saleEndsAt: true,
            },
          },
        },
      },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { customer: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      },
      hours: { orderBy: { dayOfWeek: "asc" } },
      professionals: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          slug: true,
          displayName: true,
          title: true,
          bio: true,
          avatarUrl: true,
          user: { select: { avatarUrl: true } },
        },
      },
      _count: { select: { reviews: { where: { status: "APPROVED" } }, appointments: true } },
    },
  });
}

let db: PrismaClient;
let toBusinessDetailDTO: typeof ToBusinessDetailDTO;
let businessId: string;
let businessSlug: string;

before(async () => {
  config({ path: "./.env" });

  ({ db } = await import("@urglowup/db"));
  ({ toBusinessDetailDTO } = await import("./dto"));

  const suffix = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  businessSlug = `dto-leak-${suffix}`;

  const business = await db.business.create({
    data: {
      name: `DTO Leak Test Business ${suffix}`,
      slug: businessSlug,
      ownerId: null,
      geocodingStatus: "FAILED",
      geocodingError: "internal geocoding failure detail — must never reach the wire",
      googlePlaceMatchError: "internal google match error detail — must never reach the wire",
      isEditoriallyRecommended: true,
      editorialRecommendationRank: 1,
    },
  });
  businessId = business.id;
});

after(async () => {
  if (businessId) await db.business.delete({ where: { id: businessId } }).catch(() => {});
  await db.$disconnect();
});

test("toBusinessDetailDTO exposes only the allowed public fields", async () => {
  const business = await fetchBusinessBySlug(db, businessSlug);
  assert.ok(business, "fixture business should be found");

  const dto = toBusinessDetailDTO(business);
  const dtoKeys = Object.keys(dto);

  for (const key of dtoKeys) {
    assert.ok(ALLOWED_KEYS.has(key), `unexpected key "${key}" in the public business DTO`);
  }

  const serialized = JSON.parse(JSON.stringify(dto));
  for (const forbidden of FORBIDDEN_KEYS) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(serialized, forbidden),
      false,
      `DTO must not expose internal field "${forbidden}"`,
    );
  }
});
