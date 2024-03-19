-- AlterTable
ALTER TABLE `tokens_storage` MODIFY `type` ENUM('MagicLogin', 'Refresh', 'ConfirmEmail', 'ResetPassword', 'InviteUser') NOT NULL;
