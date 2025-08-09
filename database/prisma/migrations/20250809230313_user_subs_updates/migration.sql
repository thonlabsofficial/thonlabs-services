/*
  Warnings:

  - You are about to drop the column `paymentProviderSubscriptionId` on the `users_subscriptions` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('Basic', 'Pro', 'ProLifetime');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('Active', 'Cancelled');

-- AlterTable
ALTER TABLE "users_subscriptions" DROP COLUMN "paymentProviderSubscriptionId",
ADD COLUMN     "refId" TEXT,
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'Active',
ADD COLUMN     "type" "SubscriptionType" NOT NULL DEFAULT 'Basic';
