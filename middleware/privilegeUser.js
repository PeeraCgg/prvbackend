import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

export const getUserPrivilege = async (req, res) => {
  const { lineUserId } = req.query;

  try {
    if (!lineUserId) {
      return res.status(400).json({
        success: false,
        message: 'Line User ID is required',
      });
    }

    // ค้นหาผู้ใช้โดย lineUserId
    const user = await prisma.prv_Users.findUnique({
      where: { lineUserId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let privilege = await prisma.prv_Privilege.findFirst({
      where: { userId: user.id },
    });

    // ถ้ายังไม่มี privilege ให้สร้างใหม่
    if (!privilege) {
      privilege = await prisma.prv_Privilege.create({
        data: {
          userId: user.id,
          prvType: 'Sliver',
          prvExpiredDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          currentAmount: 0,
          totalAmountPerYear: 0,
          currentPoint: 0,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        prvType: privilege.prvType,
        prvExpiredDate: privilege.prvExpiredDate,
        currentPoint: privilege.currentPoint,
      },
    });
  } catch (error) {
    console.error('Error in getUserPrivilege:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching privilege data',
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { lineUserId } = req.query;

    // Validate that lineUserId is provided
    if (!lineUserId) {
      return res.status(400).json({ error: "Line User ID is required." });
    }

    // Find the user by lineUserId
    const user = await prisma.prv_Users.findUnique({
      where: { lineUserId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const userId = user.id;

    // Retrieve user's current points from Prv_Privilege
    const privilege = await prisma.prv_Privilege.findFirst({
      where: { userId },
    });

    if (!privilege) {
      return res.status(404).json({ error: "User privilege not found." });
    }

    const maxPoints = privilege.currentPoint;

    // Retrieve product IDs already redeemed by the user
    const redeemedProductIds = await prisma.prv_History.findMany({
      where: { userId },
      select: { productId: true },
    });

    const redeemedIds = redeemedProductIds.map((history) => history.productId);

    // Fetch all products
    const products = await prisma.prv_Product.findMany({
      select: {
        id: true,
        productName: true, // Include product name
        point: true,
      },
    });

    // Map products to include an isRedeemable flag
    const productsWithRedeemableFlag = products.map((product) => ({
      ...product,
      isRedeemable: product.point <= maxPoints && !redeemedIds.includes(product.id),
    }));

    res.status(200).json({
      message: "Products retrieved successfully!",
      maxPoints,
      products: productsWithRedeemableFlag,
    });
  } catch (error) {
    console.error("Error retrieving products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const redeemProduct = async (req, res) => {
  try {
    const { lineUserId, productId } = req.body;

    // Validate required parameters
    if (!lineUserId || !productId) {
      return res.status(400).json({ error: 'Line User ID and Product ID are required.' });
    }

    // Fetch user based on lineUserId
    const user = await prisma.prv_Users.findUnique({
      where: { lineUserId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userId = user.id;

    // Check if the product was already redeemed
    const existingHistory = await prisma.prv_History.findFirst({
      where: {
        userId,
        productId: parseInt(productId),
      },
    });

    if (existingHistory) {
      return res.status(400).json({ error: 'This product has already been redeemed by the user.' });
    }

    // Fetch privilege data
    const privilege = await prisma.prv_Privilege.findFirst({
      where: { userId },
    });

    if (!privilege) {
      return res.status(404).json({ error: 'User privilege not found.' });
    }

    // Fetch product data
    const product = await prisma.prv_Product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Check if the user has enough points
    if (privilege.currentPoint < product.point) {
      return res.status(400).json({ error: 'Insufficient points to redeem this product.' });
    }

    // Deduct points and update privilege
    const updatedPrivilege = await prisma.prv_Privilege.update({
      where: { id: privilege.id },
      data: {
        currentPoint: privilege.currentPoint - product.point,
      },
    });

    // Record redemption in history
    const redeemedHistory = await prisma.prv_History.create({
      data: {
        userId,
        productId: parseInt(productId),
        transactionDate: new Date(),
      },
    });

    res.status(200).json({
      message: 'Product redeemed successfully!',
      product,
      remainingPoints: updatedPrivilege.currentPoint,
      history: redeemedHistory,
    });
  } catch (error) {
    console.error('Error redeeming product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
;
export const getRedeemedHistory = async (req, res) => {
  try {
    const { lineUserId } = req.query;

    if (!lineUserId) {
      return res.status(400).json({ error: "Line User ID is required." });
    }

    // Find the user by lineUserId
    const user = await prisma.prv_Users.findUnique({
      where: { lineUserId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const userId = user.id;

    // Fetch redeemed history
    const redeemedHistory = await prisma.prv_History.findMany({
      where: { userId },
      include: {
        product: true,
      },
    });

    if (redeemedHistory.length === 0) {
      return res.status(404).json({ message: "No redeemed history found." });
    }

    // Format the data
    const formattedHistory = redeemedHistory.map((history) => ({
      id: history.id,
      productId: history.productId,
      productName: history.product.productName,
      pointsUsed: history.product.point,
      redeemedAt: history.transactionDate,
    }));

    res.status(200).json({
      message: "Redeemed history retrieved successfully!",
      history: formattedHistory,
    });
  } catch (error) {
    console.error("Error retrieving redeemed history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getallreward = async (req, res) => {
  try {
    // Fetch all products from the database
    const products = await prisma.prv_Product.findMany({
      select: {
        id: true,
        productName: true,
        point: true,
      },
    });

    if (products.length === 0) {
      return res.status(404).json({ message: "No rewards available." });
    }

    res.status(200).json({
      success: true,
      message: "All rewards retrieved successfully.",
      products,
    });
  } catch (error) {
    console.error("Error fetching all rewards:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};



      
       
      
      
  
  