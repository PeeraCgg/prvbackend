-- CreateTable
CREATE TABLE "Prv_Users" (
    "id" SERIAL NOT NULL,
    "firstname" TEXT,
    "lastname" TEXT,
    "mobile" TEXT,
    "birthday" TIMESTAMP(3),
    "email" TEXT,

    CONSTRAINT "Prv_Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prv_Pdpa" (
    "id" SERIAL NOT NULL,
    "checkbox1" BOOLEAN NOT NULL,
    "checkbox2" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Prv_Pdpa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prv_Otp" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "Prv_Otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prv_Users_mobile_key" ON "Prv_Users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Prv_Users_email_key" ON "Prv_Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Prv_Pdpa_userId_key" ON "Prv_Pdpa"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Prv_Otp_userId_key" ON "Prv_Otp"("userId");

-- AddForeignKey
ALTER TABLE "Prv_Pdpa" ADD CONSTRAINT "Prv_Pdpa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Prv_Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prv_Otp" ADD CONSTRAINT "Prv_Otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Prv_Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
