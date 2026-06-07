import { PrismaClient } from "@prisma/client";

async function main() {
    console.log("Original DATABASE_URL:", process.env.DATABASE_URL);
    
    // Test with localhost
    console.log("\n--- Testando com DATABASE_URL padrao ---");
    const prismaDefault = new PrismaClient();
    try {
        const users = await prismaDefault.user.findMany({ take: 1 });
        console.log("Sucesso com DATABASE_URL padrao! Encontrados:", users.length);
    } catch (e: any) {
        console.error("Falha com default:", e.message);
    } finally {
        await prismaDefault.$disconnect();
    }

    // Test with 127.0.0.1
    console.log("\n--- Testando com 127.0.0.1 ---");
    const ipv4Url = "postgresql://sallonpromanager_user:sallonpromanager_password@127.0.0.1:5439/sallonpromanager_db?schema=public";
    console.log("Usando URL:", ipv4Url);
    const prismaIpv4 = new PrismaClient({
        datasources: {
            db: { url: ipv4Url }
        }
    });
    try {
        const users = await prismaIpv4.user.findMany({ take: 1 });
        console.log("Sucesso com 127.0.0.1! Encontrados:", users.length);
    } catch (e: any) {
        console.error("Falha com 127.0.0.1:", e.message);
    } finally {
        await prismaIpv4.$disconnect();
    }
}

main().catch(console.error);
