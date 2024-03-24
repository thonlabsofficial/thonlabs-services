/*
  Warnings:

  - You are about to drop the column `subscriptionId` on the `users_subscriptions` table. All the data in the column will be lost.
  - You are about to drop the `subscriptions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `subscriptions` DROP FOREIGN KEY `subscriptions_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `users_subscriptions` DROP FOREIGN KEY `users_subscriptions_subscriptionId_fkey`;

-- AlterTable
ALTER TABLE `custom_fields` MODIFY `type` ENUM('String', 'Int', 'Boolean', 'JSON') NOT NULL,
    MODIFY `relationType` ENUM('User', 'CMS') NOT NULL;

-- AlterTable
ALTER TABLE `emails_templates` MODIFY `type` ENUM('Welcome', 'MagicLink', 'ConfirmEmail', 'ForgotPassword', 'Invite') NOT NULL;

-- AlterTable
ALTER TABLE `environments` ADD COLUMN `authProvider` ENUM('MagicLogin', 'EmailAndPassword') NOT NULL DEFAULT 'EmailAndPassword';

-- AlterTable
ALTER TABLE `users_subscriptions` DROP COLUMN `subscriptionId`,
    ADD COLUMN `paymentProviderSubscriptionId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `subscriptions`;
