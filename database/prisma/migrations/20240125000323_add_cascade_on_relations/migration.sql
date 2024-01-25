-- DropForeignKey
ALTER TABLE `custom_fields` DROP FOREIGN KEY `custom_fields_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `emails_domains` DROP FOREIGN KEY `emails_domains_environmentId_fkey`;

-- DropForeignKey
ALTER TABLE `emails_templates` DROP FOREIGN KEY `emails_templates_environmentId_fkey`;

-- DropForeignKey
ALTER TABLE `projects_configs_on_environments` DROP FOREIGN KEY `projects_configs_on_environments_environmentId_fkey`;

-- DropForeignKey
ALTER TABLE `projects_configs_on_environments` DROP FOREIGN KEY `projects_configs_on_environments_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `roles` DROP FOREIGN KEY `roles_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `subscriptions` DROP FOREIGN KEY `subscriptions_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_environmentId_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_roleId_fkey`;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_environmentId_fkey` FOREIGN KEY (`environmentId`) REFERENCES `environments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `custom_fields` ADD CONSTRAINT `custom_fields_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emails_templates` ADD CONSTRAINT `emails_templates_environmentId_fkey` FOREIGN KEY (`environmentId`) REFERENCES `environments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emails_domains` ADD CONSTRAINT `emails_domains_environmentId_fkey` FOREIGN KEY (`environmentId`) REFERENCES `environments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects_configs_on_environments` ADD CONSTRAINT `projects_configs_on_environments_environmentId_fkey` FOREIGN KEY (`environmentId`) REFERENCES `environments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects_configs_on_environments` ADD CONSTRAINT `projects_configs_on_environments_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
