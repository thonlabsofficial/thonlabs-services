-- AlterTable
ALTER TABLE `environments` MODIFY `publicKey` LONGBLOB NOT NULL,
    MODIFY `secretKey` LONGBLOB NOT NULL;
