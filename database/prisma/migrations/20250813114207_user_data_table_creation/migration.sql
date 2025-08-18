/*
  Warnings:

  - You are about to drop the `users_subscriptions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "users_subscriptions" DROP CONSTRAINT "users_subscriptions_userId_fkey";

-- DropTable
DROP TABLE "users_subscriptions";

-- DropEnum
DROP TYPE "SubscriptionType";

-- CreateTable
CREATE TABLE "users_data" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_data_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users_data" ADD CONSTRAINT "users_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
