/*
  Warnings:

  - You are about to drop the `Balance` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[holderAddress]` on the table `Campaign` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Balance" DROP CONSTRAINT "Balance_userId_fkey";

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "holderAddress" TEXT;

-- DropTable
DROP TABLE "Balance";

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_holderAddress_key" ON "Campaign"("holderAddress");
