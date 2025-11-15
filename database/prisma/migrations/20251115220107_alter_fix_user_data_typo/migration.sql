-- DropForeignKey
ALTER TABLE "metadata_values" DROP CONSTRAINT "metadata_values_metadataModelId_fkey";

-- AddForeignKey
ALTER TABLE "metadata_values" ADD CONSTRAINT "metadata_values_metadataModelId_fkey" FOREIGN KEY ("metadataModelId") REFERENCES "metadata_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
