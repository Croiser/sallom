import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const user = await prisma.user.create({
        data: {
            id: '13b93721-caef-4619-9524-f2cdf678aefa',
            name: 'Douglas Dias',
            email: 'renatadouglas739@gmail.com',
            password: hashedPassword,
            slug: 'reis-podologia',
            shopName: 'Reis Podologia',
            role: 'admin',
            planId: 'plan_gold',
            status: 'active'
        }
    });
    const client = await prisma.client.create({
        data: {
            id: '20f34719-2b93-465f-b1bc-e3026e95ed10',
            ownerUid: user.id,
            name: 'Douglas Dias',
            phone: '45999959186'
        }
    });
    console.log('Restored user and client.');
}
main().finally(() => prisma.$disconnect());
