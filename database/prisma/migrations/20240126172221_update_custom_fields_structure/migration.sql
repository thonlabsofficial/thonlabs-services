/*
  Warnings:

  - You are about to drop the column `active` on the `custom_fields` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `custom_fields` table. All the data in the column will be lost.
  - You are about to drop the column `configId` on the `projects_configs_on_environments` table. All the data in the column will be lost.
  - You are about to drop the column `configType` on the `projects_configs_on_environments` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `roles` table. All the data in the column will be lost.
  - Added the required column `relationId` to the `projects_configs_on_environments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `relationType` to the `projects_configs_on_environments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `custom_fields` DROP FOREIGN KEY `custom_fields_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `roles` DROP FOREIGN KEY `roles_projectId_fkey`;

-- AlterTable
ALTER TABLE `custom_fields` DROP COLUMN `active`,
    DROP COLUMN `projectId`;

-- AlterTable
ALTER TABLE `projects_configs_on_environments` DROP COLUMN `configId`,
    DROP COLUMN `configType`,
    ADD COLUMN `relationId` VARCHAR(191) NOT NULL,
    ADD COLUMN `relationType` ENUM('CustomFields', 'UserRoles') NOT NULL;

-- AlterTable
ALTER TABLE `roles` DROP COLUMN `projectId`;
