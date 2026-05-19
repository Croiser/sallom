import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://salonuser:salonpassword@187.77.45.37:5432/salondb?schema=public"
    }
  }
});

async function run() {
  try {
    const user = await prisma.user.findUnique({where: {email: 'renatadouglas739@gmail.com'}});
    if (!user) {
      console.log('Not found');
      return;
    }
    
    console.log('User found:', user.email);
    console.log('Resetting password to @Wq7bv29g...');
    const hashedPassword = await bcrypt.hash('@Wq7bv29g', 10);
    await prisma.user.update({
      where: { email: user.email },
      data: { password: hashedPassword }
    });
    console.log('Password successfully reset to @Wq7bv29g');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
