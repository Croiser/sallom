import { PrismaClient } from "@prisma/client";

async function main() {
    const prisma = new PrismaClient();
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
        console.log("=== USUARIOS CADASTRADOS NO BANCO ===");
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error("Erro ao buscar usuarios:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
