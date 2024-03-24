/*
  Warnings:

  - You are about to drop the column `authKey` on the `environments` table. All the data in the column will be lost.
  - Added the required column `authKey` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `environments` DROP COLUMN `authKey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `authKey` VARCHAR(191) NOT NULL;
