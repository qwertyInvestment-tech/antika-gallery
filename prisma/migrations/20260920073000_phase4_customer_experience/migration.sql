-- AlterEnum
ALTER TYPE "InquiryStatus" ADD VALUE 'CONTACTED';
ALTER TYPE "ItemRequestStatus" ADD VALUE 'CONTACTED';

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN "phone" TEXT;
ALTER TABLE "ItemRequest" ADD COLUMN "phone" TEXT;
ALTER TABLE "ItemRequest" ADD COLUMN "details" TEXT;
