-- AlterTable
ALTER TABLE `environments` MODIFY `authProvider` ENUM('MagicLogin', 'EmailAndPassword') NOT NULL DEFAULT 'MagicLogin';
