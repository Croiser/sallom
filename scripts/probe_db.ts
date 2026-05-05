
import { PrismaClient } from '@prisma/client';

async function probe() {
  const configs = [
    'postgresql://salonuser:salonpassword@localhost:5432/salondb?schema=public',
    'postgresql://sallonpromanager_user:sallonpromanager_password@localhost:5432/sallonpromanager_db?schema=public',
    'postgresql://postgres:postgres@localhost:5432/postgres?schema=public',
    'postgresql://salonuser:salonpassword@localhost:5433/salondb?schema=public',
    'postgresql://sallonpromanager_user:sallonpromanager_password@localhost:5433/sallonpromanager_db?schema=public'
  ];

  for (const url of configs) {
    console.log(`Probing: ${url.split('@')[1]}`); // Log only the host part for security
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
