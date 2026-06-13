const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countUsers() {
  const count = await prisma.user.count();
  console.log(`\n\n=== NUMBER OF REGISTERED USERS: ${count} ===\n\n`);
}

countUsers()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
