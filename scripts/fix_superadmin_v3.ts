
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function fix() {
  const prisma = new PrismaClient();
  try {
    const email = 'renatadouglas739@gmail.com';
    const password = 'admin'; // Setting password to 'admin'
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: 'admin'
      },
      create: {
        name: 'Renata Douglas',
        email,
        password: hashedPassword,
        role: 'admin',
        shopName: 'Super Admin',
        slug: 'super-admin'
      }
    });
    console.log('SUCCESS: User adjusted with password: ' + password);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
fix();
