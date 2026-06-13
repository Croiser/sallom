const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['renatadouglas739@gmail.com', 'lucyr8585@gmail.com']
      }
    },
    select: {
      id: true,
      email: true,
      role: true,
      ownerId: true,
      staffId: true
    }
  });

  console.log("Users:", users);

  if (users.length === 2) {
    const clients1 = await prisma.client.count({ where: { ownerUid: users[0].id } });
    const clients2 = await prisma.client.count({ where: { ownerUid: users[1].id } });
    console.log(`Clients for ${users[0].email}:`, clients1);
    console.log(`Clients for ${users[1].email}:`, clients2);
  }
}
check().finally(() => prisma.$disconnect());
