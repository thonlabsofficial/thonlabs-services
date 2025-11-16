/*
  Warnings:

  - You are about to drop the column `customDomainCreatedAt` on the `environments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "environments" DROP COLUMN "customDomainCreatedAt",
ADD COLUMN     "customDomainStartValidationAt" TIMESTAMP(3);
