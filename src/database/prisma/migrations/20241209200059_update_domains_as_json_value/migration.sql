/*
  Warnings:

  - The `domains` column on the `organizations` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "domains",
ADD COLUMN     "domains" JSONB NOT NULL DEFAULT '[]';
