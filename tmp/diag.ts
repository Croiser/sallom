import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.plan.findMany();
  console.log('--- PLANS IN DB ---');
  console.log(JSON.stringify(plans, null, 2));
  console.log('-------------------');
  const users = await prisma.user.findMany({ take: 5 });
  console.log('--- USERS (FIRST 5) ---');
  console.log(JSON.stringify(users.map(u => ({ id: u.id, email: u.email, planId: u.planId })), null, 2));
  console.log('-----------------------');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
