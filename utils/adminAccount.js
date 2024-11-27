import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function createAdmin() {
    const hashedPassword = await bcrypt.hash("CCGRCHONBURI", 10);
    await prisma.prv_Admin.create({
      data: {
        username: "Elinear",
        password: hashedPassword, 
        role: "admin",
      },
    });
    console.log("Admin created!");
  }
  
  createAdmin();