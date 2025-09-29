-- CreateTable
CREATE TABLE `Company` (
    `company_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `industry` VARCHAR(191) NULL,

    PRIMARY KEY (`company_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmissionSource` (
    `source_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,
    `emission_factor` DOUBLE NOT NULL,

    PRIMARY KEY (`source_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmissionInput` (
    `input_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`input_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmissionInputDetail` (
    `detail_id` INTEGER NOT NULL AUTO_INCREMENT,
    `input_id` INTEGER NOT NULL,
    `source_id` INTEGER NOT NULL,
    `value` DOUBLE NOT NULL,
    `emission_value` DOUBLE NOT NULL,

    PRIMARY KEY (`detail_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmissionResult` (
    `result_id` INTEGER NOT NULL AUTO_INCREMENT,
    `input_id` INTEGER NOT NULL,
    `total_emission` DOUBLE NOT NULL,
    `status` VARCHAR(191) NULL,

    UNIQUE INDEX `EmissionResult_input_id_key`(`input_id`),
    PRIMARY KEY (`result_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Certificate` (
    `certificate_id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `issue_date` DATETIME(3) NOT NULL,
    `expiry_date` DATETIME(3) NULL,
    `level` VARCHAR(191) NULL,

    PRIMARY KEY (`certificate_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmissionInput` ADD CONSTRAINT `EmissionInput_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmissionInputDetail` ADD CONSTRAINT `EmissionInputDetail_input_id_fkey` FOREIGN KEY (`input_id`) REFERENCES `EmissionInput`(`input_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmissionInputDetail` ADD CONSTRAINT `EmissionInputDetail_source_id_fkey` FOREIGN KEY (`source_id`) REFERENCES `EmissionSource`(`source_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmissionResult` ADD CONSTRAINT `EmissionResult_input_id_fkey` FOREIGN KEY (`input_id`) REFERENCES `EmissionInput`(`input_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Certificate` ADD CONSTRAINT `Certificate_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company`(`company_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
