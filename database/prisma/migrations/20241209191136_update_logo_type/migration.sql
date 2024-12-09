/*
  Warnings:

  - You are about to drop the column `hasLogo` on the `organizations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "hasLogo",
ADD COLUMN     "logo" TEXT;
