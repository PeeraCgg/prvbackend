/*
  Warnings:

  - You are about to drop the column `password` on the `Prv_Users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Prv_Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Prv_Users" DROP COLUMN "password",
DROP COLUMN "role";

-- DropEnum
DROP TYPE "Role";
