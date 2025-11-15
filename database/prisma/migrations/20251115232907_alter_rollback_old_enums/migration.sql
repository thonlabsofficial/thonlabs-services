/*
  Warnings:

  - The values [user,organization] on the enum `MetadataModelContext` will be removed. If these variants are still used in the database, this will fail.
  - The values [string,number,boolean,json,list] on the enum `MetadataModelType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MetadataModelContext_new" AS ENUM ('environment', 'User', 'Organization');
ALTER TABLE "metadata_models" ALTER COLUMN "context" TYPE "MetadataModelContext_new" USING ("context"::text::"MetadataModelContext_new");
ALTER TYPE "MetadataModelContext" RENAME TO "MetadataModelContext_old";
ALTER TYPE "MetadataModelContext_new" RENAME TO "MetadataModelContext";
DROP TYPE "MetadataModelContext_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MetadataModelType_new" AS ENUM ('String', 'Number', 'Boolean', 'JSON', 'List');
ALTER TABLE "metadata_models" ALTER COLUMN "type" TYPE "MetadataModelType_new" USING ("type"::text::"MetadataModelType_new");
ALTER TYPE "MetadataModelType" RENAME TO "MetadataModelType_old";
ALTER TYPE "MetadataModelType_new" RENAME TO "MetadataModelType";
DROP TYPE "MetadataModelType_old";
COMMIT;
