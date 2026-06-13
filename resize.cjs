const sharp = require('sharp');

async function resize() {
  const input = 'public/logo.png';
  
  await sharp(input)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile('public/pwa-192x192.png');
    
  console.log('192x192 created');

  await sharp(input)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile('public/pwa-512x512.png');
    
  console.log('512x512 created');
}

resize().catch(console.error);
