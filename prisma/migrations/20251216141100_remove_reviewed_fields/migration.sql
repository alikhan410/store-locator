/*
  Warnings:

  - You are about to drop the column `reviewedAt` on the `StoreSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `StoreSubmission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StoreSubmission" DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedBy";
