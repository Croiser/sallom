
import { PrismaClient } from '@prisma/client';

async function check() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://salonuser:salonpassword@localhost:5432/salondb?schema=public'
      }
    }
  });

  try {
    const email = 'renatadouglas739@gmail.com';
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      console.log('USER_FOUND');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('USER_NOT_FOUND');
    }
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
