/*
  Warnings:

  - You are about to drop the column `workspaceId` on the `emails_domains` table. All the data in the column will be lost.
  - Added the required column `environmentId` to the `emails_domains` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `emails_domains` DROP FOREIGN KEY `emails_domains_workspaceId_fkey`;

-- AlterTable
ALTER TABLE `emails_domains` DROP COLUMN `workspaceId`,
    ADD COLUMN `environmentId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `environments` ADD COLUMN `appURL` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `fullName` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `emails_templates` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('MagicLink', 'ForgotPassword', 'Welcome') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `fromName` VARCHAR(191) NOT NULL,
    `fromEmail` VARCHAR(191) NOT NULL,
    `defaultContent` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `preview` VARCHAR(191) NULL,
    `replyTo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `environmentId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `emails_templates` ADD CONSTRAINT `emails_templates_environmentId_fkey` FOREIGN KEY (`environmentId`) REFERENCES `environments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emails_domains` ADD CONSTRAINT `emails_domains_environmentId_fkey` FOREIGN KEY (`environmentId`) REFERENCES `environments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
