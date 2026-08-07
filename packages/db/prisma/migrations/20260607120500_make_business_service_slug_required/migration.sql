-- AlterTable (slugs backfilled by scripts/backfill-service-slugs.ts before this migration)
ALTER TABLE "BusinessService" ALTER COLUMN "slug" SET NOT NULL;
