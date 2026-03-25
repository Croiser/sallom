import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'admin@sallonpromanager.com.br' } });
  if (user) {
    await prisma.wallet.upsert({
      where: { ownerUid: user.id },
      update: { balance: 10.00, isActive: true },
      create: { ownerUid: user.id, balance: 10.00, isActive: true }
    });
    console.log('Wallet updated for admin@sallonpromanager.com.br: R$ 10.00 and Active');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
