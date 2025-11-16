-- AlterTable
ALTER TABLE "tokens_storage" ADD COLUMN     "environmentId" TEXT;

-- AddForeignKey
ALTER TABLE "tokens_storage" ADD CONSTRAINT "tokens_storage_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
