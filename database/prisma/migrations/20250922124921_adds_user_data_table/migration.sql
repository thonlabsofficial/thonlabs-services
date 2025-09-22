-- CreateEnum
CREATE TYPE "UserDataType" AS ENUM ('Internal', 'Metadata');

-- AlterTable
ALTER TABLE "users_data" ADD COLUMN     "type" "UserDataType" NOT NULL DEFAULT 'Internal';
