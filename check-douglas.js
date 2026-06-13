import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const tokens = await prisma.clientMagicToken.findMany({
      where: { ownerUid: '09c1ae21-0a3f-4fa8-aaa2-e8b13435acca' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('TOKENS FOR DOUGLAS:', JSON.stringify(tokens, null, 2));

  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
check();
