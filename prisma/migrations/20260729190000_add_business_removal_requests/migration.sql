CREATE TYPE "BusinessClaimRequestType" AS ENUM ('OWNERSHIP', 'REMOVAL');

ALTER TABLE "BusinessClaimRequest"
ADD COLUMN "requestType" "BusinessClaimRequestType" NOT NULL DEFAULT 'OWNERSHIP';

CREATE INDEX "BusinessClaimRequest_requestType_status_idx"
ON "BusinessClaimRequest"("requestType", "status");
