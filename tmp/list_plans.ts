import prisma from '../server/db.js';

async function listPlans() {
  try {
    const plans = await prisma.plan.findMany();
    console.log('Current Plans in DB:');
    console.log(JSON.stringify(plans, null, 2));
  } catch (err) {
    console.error('Error listing plans:', err);
  } finally {
    process.exit(0);
  }
}

listPlans();
