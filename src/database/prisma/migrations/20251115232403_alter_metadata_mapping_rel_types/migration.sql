/*
  Warnings:

  - The values [Environment,User,Organization] on the enum `MetadataModelContext` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MetadataModelContext_new" AS ENUM ('environment', 'user', 'organization');
ALTER TABLE "metadata_models" ALTER COLUMN "context" TYPE "MetadataModelContext_new" USING ("context"::text::"MetadataModelContext_new");
ALTER TYPE "MetadataModelContext" RENAME TO "MetadataModelContext_old";
ALTER TYPE "MetadataModelContext_new" RENAME TO "MetadataModelContext";
DROP TYPE "MetadataModelContext_old";
COMMIT;

-- DropEnum
DROP TYPE "CustomFieldRelationsTypes";

-- DropEnum
DROP TYPE "CustomFieldTypes";

-- DropEnum
DROP TYPE "ProjectConfigRelationTypes";
