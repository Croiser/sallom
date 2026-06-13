const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const appointments = await prisma.appointment.findMany({
    where: {
      clientName: {
        contains: 'douglas',
        mode: 'insensitive'
      }
    },
    include: {
      client: true
    }
  });

  console.log(JSON.stringify(appointments, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
