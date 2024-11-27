/*
  Warnings:

  - The `prvLicenseId` column on the `Prv_Privilege` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Prv_Privilege" DROP COLUMN "prvLicenseId",
ADD COLUMN     "prvLicenseId" INTEGER;
