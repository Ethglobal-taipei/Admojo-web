/*
  Warnings:

  - Added the required column `businessAddress` to the `Provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessEmail` to the `Provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessName` to the `Provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessType` to the `Provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `Provider` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Provider_walletAddress_key";

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "accountNumber" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "businessAddress" TEXT NOT NULL,
ADD COLUMN     "businessEmail" TEXT NOT NULL,
ADD COLUMN     "businessName" TEXT NOT NULL,
ADD COLUMN     "businessType" TEXT NOT NULL,
ADD COLUMN     "paymentMethod" TEXT NOT NULL,
ADD COLUMN     "selfVerificationName" TEXT,
ADD COLUMN     "selfVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxId" TEXT,
ALTER COLUMN "walletAddress" DROP NOT NULL,
ALTER COLUMN "holderAddress" DROP NOT NULL;
