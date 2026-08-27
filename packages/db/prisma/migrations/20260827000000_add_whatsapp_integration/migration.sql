-- CreateTable
CREATE TABLE "WhatsAppIntegration" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'primary',
    "wabaId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "displayPhoneNumber" TEXT,
    "businessPortfolioId" TEXT,
    "accessTokenEncrypted" TEXT NOT NULL,
    "tokenType" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppIntegration_singletonKey_key" ON "WhatsAppIntegration"("singletonKey");

-- CreateIndex
CREATE INDEX "WhatsAppIntegration_wabaId_idx" ON "WhatsAppIntegration"("wabaId");
