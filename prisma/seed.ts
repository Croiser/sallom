import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.plan.deleteMany();
  await prisma.plan.createMany({
    data: [
      {
        id: 'plan_bronze',
        name: 'Bronze',
        slug: 'bronze',
        priceMonthly: 27.90,
        priceYearly: 257.90,
        features: JSON.stringify({ staffLimit: 1, inventory: false, reports: false, whatsapp: false })
      },
      {
        id: 'plan_silver',
        name: 'Silver',
        slug: 'silver',
        priceMonthly: 89.90,
        priceYearly: 830.90,
        features: JSON.stringify({ staffLimit: 3, inventory: true, reports: true, whatsapp: false })
      },
      {
        id: 'plan_gold',
        name: 'Gold',
        slug: 'gold',
        priceMonthly: 229.90,
        priceYearly: 2124.90,
        features: JSON.stringify({ staffLimit: null, inventory: true, reports: true, whatsapp: true })
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
