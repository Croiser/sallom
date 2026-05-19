import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'lucyr8585@gmail.com';
  console.log(`Checking user: ${email}`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      whatsappSettings: true,
      subscription: {
        include: {
          plan: true
        }
      }
    }
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User found:', JSON.stringify(user, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
