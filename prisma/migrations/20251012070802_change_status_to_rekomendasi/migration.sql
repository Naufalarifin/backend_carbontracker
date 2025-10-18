/*
  Warnings:

  - You are about to drop the column `status` on the `emissionresult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `emissionresult` DROP COLUMN `status`,
    ADD COLUMN `rekomendasi` VARCHAR(191) NULL;
