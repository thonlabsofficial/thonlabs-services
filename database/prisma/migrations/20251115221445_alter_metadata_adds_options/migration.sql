-- AlterEnum
ALTER TYPE "MetadataModelType" ADD VALUE 'List';

-- AlterTable
ALTER TABLE "metadata_models" ADD COLUMN     "options" JSONB;
