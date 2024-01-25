-- AlterTable
ALTER TABLE `environments` ADD COLUMN `refreshTokenExpiration` VARCHAR(191) NULL DEFAULT '10d',
    ADD COLUMN `tokenExpiration` VARCHAR(191) NOT NULL DEFAULT '1d';
