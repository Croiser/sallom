
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'renatadouglas739@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    console.log('User found:');
    console.log(JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      // Don't log the actual password hash for security, but we can see if it's set
      hasPassword: !!user.password,
    }, null, 2));
  } else {
    console.log('User NOT found');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
