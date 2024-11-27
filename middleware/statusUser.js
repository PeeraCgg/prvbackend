import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

export const exportStatusUser = async (req, res) => {
    const { userId } = req.params;
  
    try {
      // ตรวจสอบว่ามีการส่ง userId มาหรือไม่
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required.',
        });
      }
  
      // ดึงสถานะของผู้ใช้จากตาราง Prv_Status
      const statusRecord = await prisma.prv_Status.findUnique({
        where: { userId: parseInt(userId, 10) },
      });
  
      // ตรวจสอบว่าพบข้อมูลสถานะหรือไม่
      if (!statusRecord) {
        return res.status(404).json({
          success: false,
          message: 'Status not found for the given user ID.',
        });
      }
  
      // ตรวจสอบสถานะและส่งกลับข้อมูล
      let statusMessage = '';
      switch (statusRecord.status) {
        case 1:
          statusMessage = 'Basic information completed.';
          break;
        case 2:
          statusMessage = 'PDPA consent completed.';
          break;
        case 3:
          statusMessage = 'User verified via OTP.';
          break;
        default:
          statusMessage = 'Unknown status.';
      }
  
      return res.status(200).json({
        success: true,
        status: statusRecord.status,
        message: statusMessage,
      });
    } catch (error) {
      console.error('Error fetching user status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user status. Please try again.',
      });
    }
  };
  export const getUserStatus = async (req, res) => {
    try {
      const { lineUserId } = req.query;
  
      if (!lineUserId) {
        return res.status(400).json({ error: 'Line User ID is required' });
      }
  
      const user = await prisma.prv_Users.findUnique({
        where: { lineUserId },
        include: {
          userStatus: true, // เชื่อมโยงกับ Prv_Status
        },
      });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      console.log("User data:", user);
  
      res.status(200).json({
        userId: user.id,
        status: user.userStatus?.status || null, // ดึงสถานะจาก userStatus
        isVerified: user.isVerified || false,
      });
    } catch (error) {
      console.error('Error in getUserStatus:', error);
      res.status(500).json({ error: 'Server Error' });
    }
  };
  