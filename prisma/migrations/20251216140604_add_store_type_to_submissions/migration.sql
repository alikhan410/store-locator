/*
  Warnings:

  - You are about to drop the column `description` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `storeType` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `StoreSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `StoreSubmission` table. All the data in the column will be lost.
  - Made the column `storeType` on table `StoreSubmission` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Store" DROP COLUMN "description",
DROP COLUMN "storeType",
DROP COLUMN "tags";

-- AlterTable
ALTER TABLE "StoreSubmission" DROP COLUMN "description",
DROP COLUMN "tags",
ALTER COLUMN "storeType" SET NOT NULL;
