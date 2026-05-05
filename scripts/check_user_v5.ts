
import { PrismaClient } from '@prisma/client';

async function check() {
  const ports = [5432, 5433, 5439];
  const hosts = ['localhost', '127.0.0.1'];
  const credentials = [
    { u: 'sallonpromanager_user', p: 'sallonpromanager_password', d: 'sallonpromanager_db' },
    { u: 'salonuser', p: 'salonpassword', d: 'salondb' },
    { u: 'barbeiro', p: 'barbeiro_pass', d: 'barbeiro_db' },
    { u: 'postgres', p: 'postgres', d: 'postgres' }
  ];

  for (const port of ports) {
    for (const host of hosts) {
      for (const cred of credentials) {
        const url = `postgresql://${cred.u}:${cred.p}@${host}:${port}/${cred.d}?schema=public`;
        console.log(`Checking ${cred.u}@${host}:${port}/${cred.d}...`);
        const prisma = new PrismaClient({ datasources: { db: { url } } });
        try {
          const user = await prisma.user.findUnique({ where: { email: 'renatadouglas739@gmail.com' } });
          if (user) {
            console.log('!!! SUCCESS !!! Found user on ' + url);
            await prisma.$disconnect();
            return;
          }
        } catch (e) {
          // console.log('Failed: ' + e.message.substring(0, 30));
        } finally {
          await prisma.$disconnect();
        }
      }
    }
  }
  console.log('USER_NOT_FOUND_ANYWHERE');
}

check();
