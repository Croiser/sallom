
import { PrismaClient } from '@prisma/client';

async function check() {
  const urls = [
    'postgresql://sallonpromanager_user:sallonpromanager_password@localhost:5439/sallonpromanager_db?schema=public',
    'postgresql://sallonpromanager_user:sallonpromanager_password@127.0.0.1:5439/sallonpromanager_db?schema=public',
    'postgresql://salonuser:salonpassword@localhost:5432/salondb?schema=public',
    'postgresql://salonuser:salonpassword@127.0.0.1:5432/salondb?schema=public',
    'postgresql://barbeiro:barbeiro_pass@localhost:5432/barbeiro_db?schema=public'
  ];

  for (const url of urls) {
    console.log(`Checking ${url.split('@')[1]}...`);
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
      const user = await prisma.user.findUnique({ where: { email: 'renatadouglas739@gmail.com' } });
      if (user) {
        console.log('SUCCESS: Found user on ' + url.split('@')[1]);
        console.log(JSON.stringify({ id: user.id, email: user.email, role: user.role }));
        await prisma.$disconnect();
        return;
      }
    } catch (e) {
      // console.log('Failed: ' + e.message.substring(0, 30));
    } finally {
      await prisma.$disconnect();
    }
  }
  console.log('USER_NOT_FOUND_ANYWHERE');
}

check();
