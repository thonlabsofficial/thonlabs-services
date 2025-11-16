-- AlterTable
ALTER TABLE `emails_templates` MODIFY `type` ENUM('Welcome', 'MagicLink', 'ConfirmEmail', 'ForgotPassword') NOT NULL;
