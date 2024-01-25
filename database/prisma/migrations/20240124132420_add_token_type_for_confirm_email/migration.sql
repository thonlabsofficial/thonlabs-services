-- AlterTable
ALTER TABLE `tokens_storage` MODIFY `type` ENUM('MagicLogin', 'Refresh', 'ConfirmEmail') NOT NULL;
