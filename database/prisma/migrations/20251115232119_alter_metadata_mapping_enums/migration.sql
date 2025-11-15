/*
  Warnings:

  - The values [String,Int,Boolean,JSON] on the enum `CustomFieldTypes` will be removed. If these variants are still used in the database, this will fail.
  - The values [String,Number,Boolean,JSON,List] on the enum `MetadataModelType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CustomFieldTypes_new" AS ENUM ('string', 'int', 'boolean', 'json');
ALTER TYPE "CustomFieldTypes" RENAME TO "CustomFieldTypes_old";
ALTER TYPE "CustomFieldTypes_new" RENAME TO "CustomFieldTypes";
DROP TYPE "CustomFieldTypes_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "MetadataModelType_new" AS ENUM ('string', 'number', 'boolean', 'json', 'list');
ALTER TABLE "metadata_models" ALTER COLUMN "type" TYPE "MetadataModelType_new" USING ("type"::text::"MetadataModelType_new");
ALTER TYPE "MetadataModelType" RENAME TO "MetadataModelType_old";
ALTER TYPE "MetadataModelType_new" RENAME TO "MetadataModelType";
DROP TYPE "MetadataModelType_old";
COMMIT;
