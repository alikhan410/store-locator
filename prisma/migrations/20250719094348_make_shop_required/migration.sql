/*
  Warnings:

  - Made the column `shop` on table `Store` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Store" ALTER COLUMN "shop" SET NOT NULL;
