-- CreateTable
CREATE TABLE "Prv_Privilege" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "prvExpiredDate" TIMESTAMP(3) NOT NULL,
    "prvLicenseId" TEXT,
    "prvType" TEXT NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL,
    "totalAmountPerYear" DOUBLE PRECISION NOT NULL,
    "currentPoint" INTEGER NOT NULL,

    CONSTRAINT "Prv_Privilege_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prv_Total_Expense" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "expenseAmount" DOUBLE PRECISION NOT NULL,
    "prvType" TEXT NOT NULL,
    "expensePoint" INTEGER NOT NULL,

    CONSTRAINT "Prv_Total_Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prv_Product" (
    "id" SERIAL NOT NULL,
    "productName" TEXT NOT NULL,
    "point" INTEGER NOT NULL,

    CONSTRAINT "Prv_Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prv_History" (
    "id" SERIAL NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "Prv_History_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Prv_Privilege" ADD CONSTRAINT "Prv_Privilege_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Prv_Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prv_Total_Expense" ADD CONSTRAINT "Prv_Total_Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Prv_Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prv_History" ADD CONSTRAINT "Prv_History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Prv_Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prv_History" ADD CONSTRAINT "Prv_History_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Prv_Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
