/*
  Warnings:

  - You are about to drop the column `clientId` on the `tokens_storage` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `tokens_storage` table. All the data in the column will be lost.
  - You are about to drop the column `userRoleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `ownerClientId` on the `workspaces` table. All the data in the column will be lost.
  - You are about to drop the `clients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clients_subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users_roles` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `relationId` to the `tokens_storage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relationType` to the `tokens_storage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userOwnerId` to the `workspaces` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `clients_subscriptions` DROP FOREIGN KEY `clients_subscriptions_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `tokens_storage` DROP FOREIGN KEY `tokens_storage_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `tokens_storage` DROP FOREIGN KEY `tokens_storage_userId_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_environmentId_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_userRoleId_fkey`;

-- DropForeignKey
ALTER TABLE `users_roles` DROP FOREIGN KEY `users_roles_workspaceId_fkey`;

-- DropForeignKey
ALTER TABLE `workspaces` DROP FOREIGN KEY `workspaces_ownerClientId_fkey`;

-- AlterTable
ALTER TABLE `tokens_storage` DROP COLUMN `clientId`,
    DROP COLUMN `userId`,
    ADD COLUMN `relationId` VARCHAR(191) NOT NULL,
    ADD COLUMN `relationType` ENUM('Auth') NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `userRoleId`,
    ADD COLUMN `roleId` VARCHAR(191) NULL,
    MODIFY `environmentId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `workspaces` DROP COLUMN `ownerClientId`,
    ADD COLUMN `userOwnerId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `clients`;

-- DropTable
DROP TABLE `clients_subscriptions`;

-- DropTable
DROP TABLE `users_roles`;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `workspaceId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `paymentProviderSubscriptionId` VARCHAR(191) NULL,
    `workspaceId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_environmentId_fkey` FOREIGN KEY (`environmentId`) REFERENCES `environments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `workspaces` ADD CONSTRAINT `workspaces_userOwnerId_fkey` FOREIGN KEY (`userOwnerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users_subscriptions` ADD CONSTRAINT `users_subscriptions_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users_subscriptions` ADD CONSTRAINT `users_subscriptions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
