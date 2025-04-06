-- CreateTable
CREATE TABLE "CampaignHolder" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT NOT NULL,
    "holderAddress" TEXT NOT NULL,
    "holderType" TEXT NOT NULL DEFAULT 'Metal',
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "CampaignHolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "sourceAddress" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "transactionHash" TEXT,
    "blockNumber" INTEGER,
    "eventType" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "taps" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- AddColumn
ALTER TABLE "Campaign" ADD COLUMN "totalBudgetSpent" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "CampaignHolder_campaignId_key" ON "CampaignHolder"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignHolder_holderAddress_key" ON "CampaignHolder"("holderAddress");

-- CreateIndex
CREATE INDEX "CampaignHolder_holderAddress_idx" ON "CampaignHolder"("holderAddress");

-- CreateIndex
CREATE INDEX "PaymentTransaction_campaignId_idx" ON "PaymentTransaction"("campaignId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_sourceAddress_idx" ON "PaymentTransaction"("sourceAddress");

-- CreateIndex
CREATE INDEX "PaymentTransaction_destinationAddress_idx" ON "PaymentTransaction"("destinationAddress");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_timestamp_idx" ON "PaymentTransaction"("timestamp");

-- AddForeignKey
ALTER TABLE "CampaignHolder" ADD CONSTRAINT "CampaignHolder_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_sourceAddress_fkey" FOREIGN KEY ("sourceAddress") REFERENCES "CampaignHolder"("holderAddress") ON DELETE SET NULL ON UPDATE CASCADE; 