/*
  Warnings:

  - You are about to drop the column `workspaceId` on the `custom_fields` table. All the data in the column will be lost.
  - You are about to drop the column `workspaceId` on the `environments` table. All the data in the column will be lost.
  - You are about to drop the column `workspaceId` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `workspaceId` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the `workspaces` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workspaces_configs_on_environments` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `projectId` to the `custom_fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `environments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `roles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `custom_fields` DROP FOREIGN KEY `custom_fields_workspaceId_fkey`;

-- DropForeignKey
ALTER TABLE `environments` DROP FOREIGN KEY `environments_workspaceId_fkey`;

-- DropForeignKey
ALTER TABLE `roles` DROP FOREIGN KEY `roles_workspaceId_fkey`;

-- DropForeignKey
ALTER TABLE `subscriptions` DROP FOREIGN KEY `subscriptions_workspaceId_fkey`;

-- DropForeignKey
ALTER TABLE `workspaces` DROP FOREIGN KEY `workspaces_userOwnerId_fkey`;

-- DropForeignKey
ALTER TABLE `workspaces_configs_on_environments` DROP FOREIGN KEY `workspaces_configs_on_environments_environmentId_fkey`;

-- DropForeignKey
ALTER TABLE `workspaces_configs_on_environments` DROP FOREIGN KEY `workspaces_configs_on_environments_workspaceId_fkey`;

-- AlterTable
ALTER TABLE `custom_fields` DROP COLUMN `workspaceId`,
    ADD COLUMN `projectId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `environments` DROP COLUMN `workspaceId`,
    ADD COLUMN `projectId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `roles` DROP COLUMN `workspaceId`,
    ADD COLUMN `projectId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `subscriptions` DROP COLUMN `workspaceId`,
    ADD COLUMN `projectId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `workspaces`;

-- DropTable
DROP TABLE `workspaces_configs_on_environments`;

-- CreateTable
CREATE TABLE `projects` (
    `id` VARCHAR(191) NOT NULL,
    `appName` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userOwnerId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects_configs_on_environments` (
    `id` VARCHAR(191) NOT NULL,
    `environmentId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `configId` VARCHAR(191) NOT NULL,
    `configType` ENUM('CustomFields', 'EmailsDomains', 'UserRoles') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`environmentId`, `projectId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_userOwnerId_fkey` FOREIGN KEY (`userOwnerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `custom_fields` ADD CONSTRAINT `custom_fields_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `environments` ADD CONSTRAINT `environments_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects_configs_on_environments` ADD CONSTRAINT `projects_configs_on_environments_environmentId_fkey` FOREIGN KEY (`environmentId`) REFERENCES `environments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects_configs_on_environments` ADD CONSTRAINT `projects_configs_on_environments_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
