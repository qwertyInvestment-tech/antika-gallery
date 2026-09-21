-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'REVERSED';

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "durationSeconds" INTEGER,
ADD COLUMN     "kind" "MediaKind" NOT NULL DEFAULT 'IMAGE';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "reversedAt" TIMESTAMP(3),
ADD COLUMN     "reversedByAdminId" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_reversedByAdminId_fkey" FOREIGN KEY ("reversedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
