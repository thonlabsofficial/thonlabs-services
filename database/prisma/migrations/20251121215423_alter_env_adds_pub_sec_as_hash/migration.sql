/*
  Warnings:

  - A unique constraint covering the columns `[publicKeyHash]` on the table `environments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[secretKeyHash]` on the table `environments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicKeyHash` to the `environments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secretKeyHash` to the `environments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "environments" ADD COLUMN     "publicKeyHash" TEXT NOT NULL,
ADD COLUMN     "secretKeyHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "environments_publicKeyHash_key" ON "environments"("publicKeyHash");

-- CreateIndex
CREATE UNIQUE INDEX "environments_secretKeyHash_key" ON "environments"("secretKeyHash");
