/*
  Warnings:

  - You are about to drop the column `authKey` on the `users` table. All the data in the column will be lost.
  - Added the required column `environmentId` to the `metadata_models` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "metadata_models" ADD COLUMN     "environmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "authKey";

-- AddForeignKey
ALTER TABLE "metadata_models" ADD CONSTRAINT "metadata_models_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
