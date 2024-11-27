-- AlterTable
ALTER TABLE "Prv_Users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Prv_Status" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" INTEGER NOT NULL,

    CONSTRAINT "Prv_Status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prv_Status_userId_key" ON "Prv_Status"("userId");

-- AddForeignKey
ALTER TABLE "Prv_Status" ADD CONSTRAINT "Prv_Status_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Prv_Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
