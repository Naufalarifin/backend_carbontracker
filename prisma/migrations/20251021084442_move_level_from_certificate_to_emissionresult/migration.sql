/*
  Warnings:

  - You are about to drop the column `level` on the `certificate` table. All the data in the column will be lost.
  - You are about to drop the column `industry` on the `company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `certificate` DROP COLUMN `level`;

-- AlterTable
ALTER TABLE `company` DROP COLUMN `industry`;

-- AlterTable
ALTER TABLE `emissionresult` ADD COLUMN `level` VARCHAR(191) NULL;
