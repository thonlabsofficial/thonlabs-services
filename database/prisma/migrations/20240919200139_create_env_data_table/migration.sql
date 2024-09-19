-- CreateTable
CREATE TABLE "environment_data" (
    "id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "environmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environment_data_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "environment_data" ADD CONSTRAINT "environment_data_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
