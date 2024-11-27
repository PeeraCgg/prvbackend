import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = express.Router();

export const adminLogin =async (req, res) => {
  const { username, password } = req.body;

  try {
    // ค้นหา admin จากฐานข้อมูล
    const admin = await prisma.prv_Admin.findUnique({
      where: { username },
    });

    if (!admin) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // ตรวจสอบรหัสผ่าน
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.status(200).json({ message: "Login successful", admin: { id: admin.id, username: admin.username, role: admin.role } });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const allUsers = async (req, res) => {
  try {
    const users = await prisma.prv_Users.findMany({
      include: {
        privileges: true, // ดึงข้อมูล privileges ที่เกี่ยวข้อง
      },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const purchaseLicense = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "กรุณาระบุ userId" });
  }

  try {
    // แปลง userId เป็น Integer
    const userIdInt = parseInt(userId, 10); // ฐาน 10

    // ตรวจสอบว่าผู้ใช้มีอยู่ในระบบจริงหรือไม่
    const userExists = await prisma.prv_Users.findUnique({
      where: { id: userIdInt },
    });

    if (!userExists) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้งานในระบบ" });
    }

    // ตรวจสอบ Privilege
    const privilege = await prisma.prv_Privilege.findFirst({
      where: { userId: userIdInt },
    });

    if (!privilege) {
      return res
        .status(404)
        .json({ error: "ไม่พบ Privilege สำหรับผู้ใช้งานนี้" });
    }

    // ตรวจสอบว่าผู้ใช้งานมี License อยู่แล้วหรือไม่
    if (privilege.prvLicenseId) {
      return res.status(400).json({ error: "ผู้ใช้ได้ซื้อ License ไปแล้ว" });
    }

    // ดึงรหัส License ล่าสุด
    const lastLicense = await prisma.prv_Privilege.aggregate({
      _max: { prvLicenseId: true },
    });

    const nextLicenseId =
      lastLicense._max.prvLicenseId !== null
        ? lastLicense._max.prvLicenseId + 1
        : 1;

    // อัปเดตข้อมูล Privilege
    const updatedPrivilege = await prisma.prv_Privilege.update({
      where: { id: privilege.id },
      data: {
        prvLicenseId: nextLicenseId,
        prvType: "Diamond",
        prvExpiredDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        ),
      },
    });

    return res.status(200).json({
      message: "ซื้อ License สำเร็จ",
      data: {
        userId,
        prvLicenseId: nextLicenseId,
        licenseType: "Diamond",
        prvExpiredDate: updatedPrivilege.prvExpiredDate,
      },
    });
  } catch (error) {
    console.error("Error purchasing license:", error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
};

export const showExpense = async (req, res) => {
    const { userId } = req.params; // ดึง userId จาก URL
  
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
  
    try {
      // ตรวจสอบว่า user มี privilege หรือไม่
      const privilege = await prisma.prv_Privilege.findFirst({
        where: { userId: parseInt(userId, 10) }, // แปลง userId เป็น Int
      });
  
      if (!privilege) {
        return res.status(404).json({ error: 'Privilege not found for this user.' });
      }
  
      // ดึงประวัติการใช้จ่าย
      const expenses = await prisma.prv_Total_Expense.findMany({
        where: { userId: parseInt(userId, 10) },
        orderBy: { transactionDate: 'desc' }, // เรียงลำดับจากวันที่ล่าสุดไปยังเก่าสุด
      });
  
      res.status(200).json({
        message: 'Expense history retrieved successfully',
        data: {
          totalAmountPerYear: privilege.totalAmountPerYear,
          prvType: privilege.prvType,
          expenses,
        },
      });
    } catch (error) {
      console.error('Error retrieving expense history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
export const addExpense = async (req, res) => {
    try {
      const expenseAmount = parseFloat(req.body.expenseAmount); // Ensure numeric input
      const transactionDate = req.body.transactionDate;
      const userId = parseInt(req.params.userId, 10); // Correctly parse userId
  
      if (!userId || isNaN(expenseAmount) || !transactionDate) {
        return res.status(400).json({ error: 'All fields are required' });
      }
  
      // Check for privilege
      const privilege = await prisma.prv_Privilege.findFirst({
        where: { userId },
      });
  
      if (!privilege) {
        return res.status(404).json({ error: 'Privilege not found for this user.' });
      }
  
      // Calculate totalAmountPerYear
      const updatedTotalAmountPerYear = privilege.totalAmountPerYear + expenseAmount;
  
      // Update privilege type
      let updatedPrvType = privilege.prvType;
      if (privilege.prvType !== 'Diamond') {
        if (updatedTotalAmountPerYear < 50000) {
          updatedPrvType = 'Silver';
        } else if (updatedTotalAmountPerYear < 100000) {
          updatedPrvType = 'Gold';
        } else {
          updatedPrvType = 'Platinum';
        }
      }
  
      // Handle Diamond type expiration
      if (privilege.prvType === 'Diamond' && privilege.prvExpiredDate) {
        const now = new Date();
        const oneYearLater = new Date(privilege.prvExpiredDate);
        if (now <= oneYearLater) {
          updatedPrvType = 'Diamond';
        }
      }
  
      // Calculate new points based on updated privilege type
      const pointRates = { Diamond: 80, Platinum: 100, Gold: 130, Silver: 150 };
      const rate = pointRates[updatedPrvType] || pointRates['Silver'];
      const totalAmount = privilege.currentAmount + expenseAmount;
      const pointsEarned = Math.floor(totalAmount / rate);
      const remainingAmount = totalAmount % rate;
  
      // Save the expense
      const expense = await prisma.prv_Total_Expense.create({
        data: {
          userId,
          expenseAmount,
          transactionDate: new Date(transactionDate),
          prvType: updatedPrvType,
          expensePoint: pointsEarned,
        },
      });
  
      // Update privilege
      const updatedPrivilege = await prisma.prv_Privilege.update({
        where: { id: privilege.id },
        data: {
          currentAmount: remainingAmount,
          totalAmountPerYear: updatedTotalAmountPerYear,
          prvType: updatedPrvType,
          currentPoint: privilege.currentPoint + pointsEarned,
        },
      });
  
      res.json({
        message: 'Expense added successfully!',
        expense,
        privilege: updatedPrivilege,
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
export const deleteExpenseWithTransaction = async (req, res) => {
    try {
      const { expenseId } = req.body;
  
      const expense = await prisma.$transaction(async (prisma) => {
        const expense = await prisma.prv_Total_Expense.findUnique({
          where: { id: expenseId },
        });
  
        if (!expense) {
          throw new Error('Expense not found.');
        }
  
        const privilege = await prisma.prv_Privilege.findFirst({
          where: { userId: expense.userId },
        });
  
        if (!privilege) {
          throw new Error('Privilege not found.');
        }
  
        const updatedTotalAmountPerYear = privilege.totalAmountPerYear - expense.expenseAmount;
        const updatedCurrentAmount = privilege.currentAmount - (expense.expenseAmount % 150);
        const updatedPoints = privilege.currentPoint - expense.expensePoint;
  
        await prisma.prv_Privilege.update({
          where: { id: privilege.id },
          data: {
            totalAmountPerYear: updatedTotalAmountPerYear,
            currentAmount: Math.max(updatedCurrentAmount, 0),
            currentPoint: Math.max(updatedPoints, 0),
          },
        });
  
        await prisma.prv_Total_Expense.delete({
          where: { id: expenseId },
        });
  
        return expense;
      });
  
      res.json({ message: 'Expense deleted successfully.', expense });
    } catch (error) {
      console.error('Error in transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
export const deleteExpense = async (req, res) => {
    const { expenseId } = req.params; // ดึง expenseId จาก URL
  
    if (!expenseId) {
      return res.status(400).json({ error: 'Expense ID is required' });
    }
  
    try {
      // ตรวจสอบว่ามีค่าใช้จ่ายในระบบหรือไม่
      const expense = await prisma.prv_Total_Expense.findUnique({
        where: { id: parseInt(expenseId, 10) },
      });
  
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found.' });
      }
  
      // ลบค่าใช้จ่าย
      await prisma.prv_Total_Expense.delete({
        where: { id: parseInt(expenseId, 10) },
      });
  
      res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
export const getAllProducts = async (req, res) => {
    try {
      const products = await prisma.prv_Product.findMany({
        orderBy: { point: 'desc' }, // Order by points descending
      });
  
      res.status(200).json({ success: true, products });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch products' });
    }
  };
  
  export const addProducts = async (req, res) => {
    try {
      const { products } = req.body;
  
      if (!products || !Array.isArray(products)) {
        return res.status(400).json({ error: 'Products must be an array.' });
      }
  
      // Fetch all existing product IDs
      const existingProducts = await prisma.prv_Product.findMany({
        select: { id: true },
      });
  
      const existingIds = new Set(existingProducts.map((p) => p.id));
  
      // Find the smallest available ID for missing entries
      let nextAvailableId = 1;
      const productsWithId = products.map((product) => {
        while (existingIds.has(nextAvailableId)) {
          nextAvailableId++;
        }
        const productWithId = { ...product, id: nextAvailableId };
        existingIds.add(nextAvailableId); // Mark ID as used
        nextAvailableId++;
        return productWithId;
      });
  
      // Insert products into the database
      const createdProducts = await prisma.prv_Product.createMany({
        data: productsWithId,
        skipDuplicates: true, // Skip duplicates based on unique fields
      });
  
      res.status(201).json({
        message: 'Products added successfully!',
        createdCount: createdProducts.count,
      });
    } catch (error) {
      console.error('Error adding products:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
export const deleteProduct = async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!id) {
        return res.status(400).json({ error: 'Product ID is required.' });
      }
  
      // ตรวจสอบว่าสินค้ามีอยู่หรือไม่
      const existingProduct = await prisma.prv_Product.findUnique({
        where: { id: parseInt(id) },
      });
  
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found.' });
      }
  
      // ลบสินค้า
      await prisma.prv_Product.delete({
        where: { id: parseInt(id) },
      });
  
      res.status(200).json({
        message: 'Product deleted successfully!',
        productId: id,
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  
  
  
  
  
  
  
  
 


