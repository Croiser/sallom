
import { Client } from 'pg';

async function listDbs() {
  const configs = [
    { host: 'localhost', port: 5432, user: 'postgres', password: 'postgres' },
    { host: 'localhost', port: 5433, user: 'postgres', password: 'postgres' },
    { host: 'localhost', port: 5432, user: 'salonuser', password: 'salonpassword' },
    { host: 'localhost', port: 5433, user: 'salonuser', password: 'salonpassword' },
    { host: 'localhost', port: 5432, user: 'sallonpromanager_user', password: 'sallonpromanager_password' },
    { host: 'localhost', port: 5433, user: 'sallonpromanager_user', password: 'sallonpromanager_password' }
  ];

  for (const config of configs) {
    console.log(`Trying ${config.user}@${config.host}:${config.port}`);
    const client = new Client({ ...config, database: 'postgres' });
    try {
      await client.connect();
      console.log('CONNECTED');
      const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
      console.log('Databases:', res.rows.map(r => r.datname).join(', '));
      await client.end();
    } catch (e) {
      console.log('FAILED:', e.message);
    }
  }
}

listDbs();
