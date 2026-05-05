
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function fix() {
  const connectionString = 'postgresql://salonuser:salonpassword@localhost:5432/salondb?schema=public';
  console.log('Connecting to:', connectionString);
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected!');
    
    const email = 'renatadouglas739@gmail.com';
    const password = 'admin';
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const res = await client.query('SELECT * FROM users WHERE email = \$1', [email]);
    if (res.rows.length > 0) {
      console.log('Updating user...');
      await client.query('UPDATE users SET password = \$1, role = \$2 WHERE email = \$3', [hashedPassword, 'admin', email]);
      console.log('User updated successfully!');
    } else {
      console.log('Creating user...');
      await client.query(
        'INSERT INTO users (id, name, email, password, role, "shopName", slug, status) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8)',
        [
          require('crypto').randomUUID(),
          'Renata Douglas',
          email,
          hashedPassword,
          'admin',
          'Super Admin',
          'super-admin',
          'active'
        ]
      );
      console.log('User created successfully!');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

fix();
