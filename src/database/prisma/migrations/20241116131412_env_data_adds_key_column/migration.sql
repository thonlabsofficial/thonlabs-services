/*
  Warnings:

  - The primary key for the `environment_data` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `environment_data` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `key` to the `environment_data` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "environment_data" DROP CONSTRAINT "environment_data_pkey",
ADD COLUMN     "key" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "environment_data_pkey" PRIMARY KEY ("id");
