
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function checkDile() {
  // Use pg client directly or prisma with the dile URL
  // Since I don't have the prisma client for dile generated in this workspace, 
  // I'll try to use the one in SALAOPROMANAGER but with the dile URL
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:root@localhost:5432/dilesystem?schema=public'
      }
    }
  });

  try {
    const email = 'renatadouglas739@gmail.com';
    const user = await (prisma as any).user.findUnique({
      where: { email },
    });

    if (user) {
      console.log('USER_FOUND_IN_DILESYSTEM');
      console.log(JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
        hasPassword: !!user.password
      }, null, 2));
    } else {
      console.log('USER_NOT_FOUND_IN_DILESYSTEM');
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDile();
