/*
  Warnings:

  - Made the column `authKey` on table `environments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `environments` MODIFY `authKey` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `tokens_storage` MODIFY `type` ENUM('MagicLogin', 'Refresh', 'ConfirmEmail', 'ResetPassword') NOT NULL;
