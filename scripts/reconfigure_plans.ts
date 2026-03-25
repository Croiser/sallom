import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Current Plans ---');
  const allPlans = await prisma.plan.findMany();
  console.log(JSON.stringify(allPlans, null, 2));

  console.log('\n--- Reconfiguring for 2 Plans (No WhatsApp) ---');
  
  // 1. Bronze Plan: 1 Employee, Inventory: No, Reports: No, WhatsApp: No
  await prisma.plan.update({
    where: { id: 'plan_bronze' },
    data: {
      name: 'Bronze',
      priceMonthly: 49.90,
      priceYearly: 499.00,
      features: JSON.stringify({
        staffLimit: 1,
        inventory: false,
        reports: false,
        whatsapp: false
      })
    }
  });

  // 2. Silver Plan: Unlimited Employees (or high limit), Inventory: Yes, Reports: Yes, WhatsApp: No
  await prisma.plan.update({
    where: { id: 'plan_silver' },
    data: {
      name: 'Prata',
      priceMonthly: 89.90,
      priceYearly: 899.00,
      features: JSON.stringify({
        staffLimit: null,
        inventory: true,
        reports: true,
        whatsapp: false
      })
    }
  });

  // 3. Gold Plan: We'll keep it as a backup but maybe hide it in the UI
  // Or just update it to be "Premium" and also no whatsapp for now
  await prisma.plan.update({
    where: { id: 'plan_gold' },
    data: {
      name: 'Premium (Oculto)',
      features: JSON.stringify({
        staffLimit: null,
        inventory: true,
        reports: true,
        whatsapp: false,
        hidden: true
      })
    }
  });

  console.log('Plans reconfigured successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
