import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const generateOtp = async (userId) => {
  try {
    // สร้างรหัส OTP แบบสุ่ม 6 หลัก
    const otp = crypto.randomInt(100000, 999999).toString();

    // ตั้งเวลาหมดอายุ OTP (เช่น หมดอายุภายใน 10 นาที)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // ตรวจสอบว่ามี OTP สำหรับ userId นี้อยู่แล้วหรือไม่
    const existingOtp = await prisma.prv_Otp.findUnique({
      where: {
        userId: userId,
      },
    });

    let newOtp;
    if (existingOtp) {
      // ถ้ามี OTP อยู่แล้ว ให้ทำการอัปเดต
      newOtp = await prisma.prv_Otp.update({
        where: {
          id: existingOtp.id, // ใช้ id ของ OTP ที่มีอยู่
        },
        data: {
          code: otp,
          expiresAt: expiresAt,
        },
      });
    } else {
      // ถ้ายังไม่มี OTP สำหรับ userId นี้ ให้สร้างใหม่
      newOtp = await prisma.prv_Otp.create({
        data: {
          userId: userId,
          code: otp,
          expiresAt: expiresAt,
        },
      });
    }

    // คืนค่า OTP ที่สร้างขึ้นมา
    return newOtp.code;
  } catch (error) {
    console.error('Error generating OTP:', error);
    throw new Error('Failed to generate OTP');
  }
};
