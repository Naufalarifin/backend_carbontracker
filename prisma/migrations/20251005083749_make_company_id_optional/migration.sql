-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_company_id_fkey`;

-- DropIndex
DROP INDEX `User_company_id_fkey` ON `user`;

-- AlterTable
ALTER TABLE `user` MODIFY `company_id` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`company_id`) ON DELETE SET NULL ON UPDATE CASCADE;
