import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://salonuser:salonpass2024@187.77.45.37:5432/salondb?schema=public"
    }
  }
});

async function main() {
  const appointments = await prisma.appointment.findMany({
    where: {
      clientName: {
        contains: 'douglas',
        mode: 'insensitive'
      }
    },
    orderBy: {
      date: 'desc'
    },
    take: 5,
    include: {
      owner: {
        select: {
          id: true,
          shopName: true
        }
      }
    }
  });
  console.log(JSON.stringify(appointments, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
