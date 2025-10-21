-- AlterTable: rename column rekomendasi to analisis on emissionresult
ALTER TABLE `emissionresult`
  CHANGE COLUMN `rekomendasi` `analisis` TEXT NULL;


