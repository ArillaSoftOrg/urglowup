DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'BusinessInvitation'
      AND column_name = 'token'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'BusinessInvitation'
      AND column_name = 'tokenHash'
  ) THEN
    ALTER TABLE "BusinessInvitation" RENAME COLUMN "token" TO "tokenHash";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'BusinessInvitation_token_key'
  ) THEN
    ALTER INDEX "BusinessInvitation_token_key" RENAME TO "BusinessInvitation_tokenHash_key";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'BusinessInvitation_token_idx'
  ) THEN
    ALTER INDEX "BusinessInvitation_token_idx" RENAME TO "BusinessInvitation_tokenHash_idx";
  END IF;
END $$;
