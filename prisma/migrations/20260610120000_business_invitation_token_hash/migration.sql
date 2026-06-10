-- Rename BusinessInvitation.token to tokenHash (table is unused; no data to migrate)
ALTER TABLE "BusinessInvitation" RENAME COLUMN "token" TO "tokenHash";

-- Rename indexes/constraints to match the new column name
ALTER INDEX "BusinessInvitation_token_key" RENAME TO "BusinessInvitation_tokenHash_key";
ALTER INDEX "BusinessInvitation_token_idx" RENAME TO "BusinessInvitation_tokenHash_idx";
