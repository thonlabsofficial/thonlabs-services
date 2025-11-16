/*
  Warnings:

  - You are about to drop the column `name` on the `workspaces` table. All the data in the column will be lost.
  - Added the required column `appName` to the `workspaces` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `workspaces` DROP COLUMN `name`,
    ADD COLUMN `appName` VARCHAR(191) NOT NULL;
