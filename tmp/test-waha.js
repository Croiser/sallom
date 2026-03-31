import http from 'http';

const req = http.request({
  hostname: 'waha',
  port: 3000,
  path: '/api/sessions/default',
  method: 'GET',
  headers: { 'X-Api-Key': 'waha_secret_key_2024' }
}, (res) => {
  let d = '';
  res.on('data', (c) => d += c);
  res.on('end', () => console.log(d.substring(0, 300)));
});

req.on('error', (e) => console.error('Error:', e.message));
req.end();