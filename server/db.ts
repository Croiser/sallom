import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function initDb() {
  // Prisma manages the connection automatically, but we can do a connection test or seeding here if needed.
  console.log('Database initialized successfully with Prisma.');
  
  // Example of automated seeding the default plans, matching the old SQLite logic:
  prisma.plan.count().then(async (count) => {
    if (count === 0) {
      await prisma.plan.createMany({
        data: [
          {
            id: 'plan_bronze',
            name: 'Bronze',
            slug: 'bronze',
            priceMonthly: 49.90,
            priceYearly: 499.00,
            features: JSON.stringify({ staffLimit: 1, inventory: false, reports: false, whatsapp: false })
          },
          {
            id: 'plan_silver',
            name: 'Silver',
            slug: 'silver',
            priceMonthly: 89.90,
            priceYearly: 899.00,
            features: JSON.stringify({ staffLimit: 3, inventory: true, reports: true, whatsapp: false })
          },
          {
            id: 'plan_gold',
            name: 'Gold',
            slug: 'gold',
            priceMonthly: 149.90,
            priceYearly: 1499.00,
            features: JSON.stringify({ staffLimit: null, inventory: true, reports: true, whatsapp: true })
          }
        ]
      });
      console.log('Seeded default plans.');
    }
  }).catch(e => {
    console.error('Error seeding plans: ', e);
  });
}

export default prisma;
