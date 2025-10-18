-- AlterTable
ALTER TABLE `company` ADD COLUMN `jenis_perusahaan` VARCHAR(191) NULL,
    ADD COLUMN `jumlah_karyawan` INTEGER NULL,
    ADD COLUMN `pendapatan_perbulan` DOUBLE NULL,
    ADD COLUMN `ton_barang_perbulan` DOUBLE NULL,
    ADD COLUMN `unit_produk_perbulan` INTEGER NULL;
