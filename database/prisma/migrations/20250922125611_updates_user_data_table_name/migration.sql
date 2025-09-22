/*
  Warnings:

  - You are about to drop the `users_data` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "users_data" DROP CONSTRAINT "users_data_userId_fkey";

-- DropTable
DROP TABLE "users_data";

-- CreateTable
CREATE TABLE "user_data" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "UserDataType" NOT NULL DEFAULT 'Internal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_data_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_data" ADD CONSTRAINT "user_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
