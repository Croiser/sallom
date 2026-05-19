import { PrismaClient } from '@prisma/client';

async function updateRole() {
  const configs = [
    process.env.DATABASE_URL,
    'postgresql://sallonpromanager_user:sallonpromanager_password@localhost:5439/sallonpromanager_db?schema=public',
    'postgresql://salonuser:salonpassword@localhost:5432/salondb?schema=public',
    'postgresql://sallonpromanager_user:sallonpromanager_password@localhost:5432/sallonpromanager_db?schema=public',
    'postgresql://postgres:postgres@localhost:5432/postgres?schema=public',
    'postgresql://salonuser:salonpassword@localhost:5433/salondb?schema=public',
    'postgresql://sallonpromanager_user:sallonpromanager_password@localhost:5433/sallonpromanager_db?schema=public',
    'postgresql://sallonpromanager_user:sallonpromanager_password@193.203.175.149:5432/sallonpromanager_db?schema=public'
  ].filter(Boolean);

  const email = 'lucyr8585@gmail.com';
  let success = false;

  for (const url of configs) {
    if (!url) continue;
    console.log(`Trying URL: ${url.split('@')[1] || url}`);
    
    const prisma = new PrismaClient({
      datasources: { db: { url } }
    });

    try {
      await prisma.$connect();
      console.log(`SUCCESS connected to ${url.split('@')[1] || url}`);
      
      const user = await prisma.user.findUnique({ where: { email } });
      
      if (user) {
        console.log(`FOUND user ${email} in this DB. Current role: ${user.role}`);
        const updated = await prisma.user.update({
          where: { email },
          data: { role: 'admin' }
        });
        console.log(`Successfully updated role to 'admin' for user ${email}`);
        success = true;
      } else {
        console.log(`User ${email} NOT FOUND in this DB`);
      }
      
      await prisma.$disconnect();
      if (success) break;
    } catch (e: any) {
      console.log(`FAILED: ${e.message.substring(0, 80)}...`);
      await prisma.$disconnect().catch(() => {});
    }
  }

  if (!success) {
    console.log('Could not update user in any of the databases.');
  }
}

updateRole().catch(console.error);
