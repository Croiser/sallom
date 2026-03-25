import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Using DATABASE_URL:', process.env.DATABASE_URL);
  await prisma.plan.deleteMany();
  await prisma.plan.createMany({
    data: [
      {
        id: 'plan_bronze',
        name: 'Bronze',
        slug: 'bronze',
        priceMonthly: 27.90,
        priceYearly: 279.00,
        features: JSON.stringify({ staffLimit: 1, inventory: false, reports: false, whatsapp: false })
      },
      {
        id: 'plan_silver',
        name: 'Prata',
        slug: 'silver',
        priceMonthly: 89.90,
        priceYearly: 899.00,
        features: JSON.stringify({ staffLimit: null, inventory: true, reports: true, whatsapp: false })
      }
    ]
  });
  console.log('Seeded plans.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
