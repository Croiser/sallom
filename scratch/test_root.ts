import { PrismaClient } from '@prisma/client';

async function testRoot() {
  const url = `postgresql://postgres:root@localhost:5433/postgres?schema=public`;
  console.log(`Querying databases via: ${url}`);
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });
  try {
    await prisma.$connect();
    console.log(`SUCCESS connected to ${url}`);
    
    // Query list of databases
    const dbs: any = await prisma.$queryRaw`SELECT datname FROM pg_database WHERE datistemplate = false;`;
    console.log("Databases found:", dbs);
    
  } catch (e: any) {
    console.log(`FAILED:`, e);
  } finally {
    await prisma.$disconnect();
  }
}

testRoot();
