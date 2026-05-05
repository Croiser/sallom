
import { PrismaClient } from '@prisma/client';

async function probe() {
  const configs = [
    'postgresql://barbeiro:barbeiro_pass@localhost:5432/barbeiro_db?schema=public',
    'postgresql://barbeiro:barbeiro_pass@localhost:5433/barbeiro_db?schema=public',
    'postgresql://salonuser:salonpassword@localhost:5432/salondb?schema=public',
    'postgresql://salonuser:salonpassword@localhost:5433/salondb?schema=public'
  ];

  for (const url of configs) {
    console.log(`Probing: ${url.split('@')[1]}`);
    const prisma = new PrismaClient({
      datasources: { db: { url } }
    });

    try {
      await prisma.$connect();
      console.log(`SUCCESS connected to ${url.split('@')[1]}`);
      
      const email = 'renatadouglas739@gmail.com';
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (user) {
        console.log(`FOUND user ${email} in this DB`);
      } else {
        console.log(`USER NOT FOUND in this DB`);
      }
      
      await prisma.$disconnect();
    } catch (e) {
      console.log(`FAILED: ${e.message.substring(0, 50)}...`);
    }
  }
}

probe();
