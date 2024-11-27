-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable
ALTER TABLE "Prv_Users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
