/*
  Warnings:

  - You are about to drop the column `roleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `app_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `custom_fields` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projects_configs_on_environments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MetadataType" AS ENUM ('String', 'Number', 'Boolean', 'JSON');

-- CreateEnum
CREATE TYPE "MetadataContext" AS ENUM ('Environment', 'User', 'Organization');

-- DropForeignKey
ALTER TABLE "projects_configs_on_environments" DROP CONSTRAINT "projects_configs_on_environments_environmentId_fkey";

-- DropForeignKey
ALTER TABLE "projects_configs_on_environments" DROP CONSTRAINT "projects_configs_on_environments_projectId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_roleId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "roleId";

-- DropTable
DROP TABLE "app_data";

-- DropTable
DROP TABLE "custom_fields";

-- DropTable
DROP TABLE "projects_configs_on_environments";

-- DropTable
DROP TABLE "roles";

-- CreateTable
CREATE TABLE "metadata" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "type" "MetadataType" NOT NULL,
    "context" "MetadataContext" NOT NULL,
    "value" JSONB NOT NULL,
    "relationId" TEXT NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "metadata_key_context_relationId_key" ON "metadata"("key", "context", "relationId");
