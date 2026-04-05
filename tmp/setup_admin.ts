import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://sallonpromanager_user:sallonpromanager_password@localhost:5439/sallonpromanager_db?schema=public"
    }
  }
});

async function main() {
  const email = 'renatadouglas739@gmail.com';
  const password = 'admin1'; // Temporary password
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      planId: 'plan_gold',
      role: 'admin'
    },
    create: {
      name: 'Super Admin',
      email,
      password: hashedPassword,
      planId: 'plan_gold',
      role: 'admin',
      shopName: 'Barbeiro Manager Admin'
    }
  });

  console.log(`Admin user ${user.email} updated/created successfully.`);
  console.log(`Password set to: ${password}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
