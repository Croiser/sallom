import { PrismaClient } from '@prisma/client';

async function testRemotes() {
  const configs = [
    'postgresql://salonuser:salonpass2024@187.77.45.37:5432/salondb?schema=public',
    'postgresql://sallonpromanager_user:sallonpromanager_password@193.203.175.149:5432/sallonpromanager_db?schema=public'
  ];
  
  for (const url of configs) {
    console.log(`Connecting to: ${url.split('@')[1]}`);
    const prisma = new PrismaClient({
      datasources: { db: { url } }
    });
    try {
      await prisma.$connect();
      console.log(`SUCCESS connected to ${url.split('@')[1]}`);
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      console.log(`FOUND ${users.length} users:`);
      console.log(JSON.stringify(users, null, 2));
      await prisma.$disconnect();
      return; // If successful, we can stop
    } catch (e: any) {
      console.log(`FAILED: ${e.message.substring(0, 150)}...`);
    } finally {
      await prisma.$disconnect();
    }
  }
}

testRemotes();
