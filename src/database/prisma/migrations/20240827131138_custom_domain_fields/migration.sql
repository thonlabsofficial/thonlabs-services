-- CreateEnum
CREATE TYPE "CustomDomainStatus" AS ENUM ('Verifying', 'Verified', 'Failed');

-- AlterTable
ALTER TABLE "environments" ADD COLUMN     "customDomain" TEXT,
ADD COLUMN     "customDomainCreatedAt" TIMESTAMP(3),
ADD COLUMN     "customDomainLastValidationAt" TIMESTAMP(3),
ADD COLUMN     "customDomainStatus" "CustomDomainStatus";
