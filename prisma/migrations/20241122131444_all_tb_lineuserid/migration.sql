/*
  Warnings:

  - A unique constraint covering the columns `[lineUserId]` on the table `Prv_Users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Prv_Users" ADD COLUMN     "lineUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Prv_Users_lineUserId_key" ON "Prv_Users"("lineUserId");
