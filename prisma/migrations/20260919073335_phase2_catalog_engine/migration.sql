/*
  Warnings:

  - The `condition` column on the `Item` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('NEW_UNUSED', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'USED', 'RESTORATION');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "certificateNotes" TEXT,
ADD COLUMN     "conditionNotes" TEXT,
ADD COLUMN     "documentationNotes" TEXT,
ADD COLUMN     "expertNotes" TEXT,
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shortDescription" TEXT,
DROP COLUMN "condition",
ADD COLUMN     "condition" "ItemCondition";

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
