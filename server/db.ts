import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import admin from 'firebase-admin';

const prisma = new PrismaClient();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'sallonpromanager'
  });
}

export function initDb() {
  console.log('Initializing Database with Prisma...');
  
  // Seed default plans
  prisma.plan.count().then(async (count) => {
    console.log(`Current plan count: ${count}`);
    const plans = [
      {
        id: 'plan_bronze',
        name: 'Bronze',
        slug: 'bronze',
        priceMonthly: 49.90,
        priceYearly: 499.00,
        features: { staffLimit: 1, inventory: false, reports: false, whatsapp: false }
      },
      {
        id: 'plan_silver',
        name: 'Silver',
        slug: 'silver',
        priceMonthly: 89.90,
        priceYearly: 899.00,
        features: { staffLimit: 3, inventory: true, reports: true, whatsapp: false }
      },
      {
        id: 'plan_gold',
        name: 'Gold',
        slug: 'gold',
        priceMonthly: 149.90,
        priceYearly: 1499.00,
        features: { staffLimit: null, inventory: true, reports: true, whatsapp: true }
      }
    ];

    if (count === 0) {
      console.log('Seeding default plans to Prisma...');
      await prisma.plan.createMany({
        data: plans.map(p => ({ ...p, features: JSON.stringify(p.features) }))
      });
      console.log('Seeded default plans to Prisma.');
    }
  }).catch(e => {
    console.error('Error seeding plans: ', e);
  });

  // Seed default admin user
  prisma.user.count().then(async (count) => {
    console.log(`Current user count: ${count}`);
    if (count === 0) {
      console.log('Seeding default admin user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@sallonpromanager.com.br',
          password: hashedPassword,
          role: 'admin',
          shopName: 'SallonProManager Studio',
          slug: 'sallonpromanager-studio',
          status: 'active'
        }
      });
      console.log('Seeded default admin user: admin@sallonpromanager.com.br / password123');
    }
  }).catch(e => {
    console.error('Error seeding user: ', e);
  });
}

export default prisma;
