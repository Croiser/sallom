
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function fixUser() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://salonuser:salonpassword@db:5432/salondb?schema=public'
      }
    }
  });

  try {
    const email = 'renatadouglas739@gmail.com';
    const password = 'admin'; // We will set it to 'admin' as requested or for testing
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: 'admin', // In this system 'admin' seems to be the highest role based on SuperAdmin.tsx
        status: 'active'
      },
      create: {
        name: 'Renata Douglas',
        email,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        shopName: 'Super Admin',
        slug: 'super-admin'
      }
    });

    console.log('SUCCESS: User adjusted');
    console.log(JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      newPassword: password
    }, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUser();
