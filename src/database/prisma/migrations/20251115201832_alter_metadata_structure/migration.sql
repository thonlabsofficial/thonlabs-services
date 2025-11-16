/*
  Warnings:

  - You are about to drop the `metadata` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MetadataModelType" AS ENUM ('String', 'Number', 'Boolean', 'JSON');

-- CreateEnum
CREATE TYPE "MetadataModelContext" AS ENUM ('Environment', 'User', 'Organization');

-- DropTable
DROP TABLE "metadata";

-- DropEnum
DROP TYPE "MetadataContext";

-- DropEnum
DROP TYPE "MetadataType";

-- CreateTable
CREATE TABLE "metadata_models" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "type" "MetadataModelType" NOT NULL,
    "context" "MetadataModelContext" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metadata_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metadata_values" (
    "metadataModelId" INTEGER NOT NULL,
    "relationId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metadata_values_pkey" PRIMARY KEY ("metadataModelId","relationId")
);

-- AddForeignKey
ALTER TABLE "metadata_values" ADD CONSTRAINT "metadata_values_metadataModelId_fkey" FOREIGN KEY ("metadataModelId") REFERENCES "metadata_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
