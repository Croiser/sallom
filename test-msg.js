const { PrismaClient } = require('@prisma/client');
const { WAHAService } = require('./dist-server/waha.js'); 

const prisma = new PrismaClient();

async function run() {
  try {
    const client = await prisma.client.findFirst({
      where: {
        name: {
          contains: 'douglas dias',
          mode: 'insensitive'
        }
      }
    });

    if (!client) {
      console.log('Client Douglas Dias not found');
      return;
    }

    console.log('Found client:', client.name, client.phone);

    if (!client.phone) {
      console.log('Client has no phone number');
      return;
    }

    const ownerId = client.ownerUid;
    console.log('Owner ID for this client:', ownerId);

    const waha = new WAHAService(process.env.WAHA_API_URL || 'http://waha:8080');
    
    console.log('Sending message via session:', ownerId);
    const result = await waha.sendTextMessage(ownerId, client.phone, "Olá Douglas, esta é uma mensagem de teste automático do sistema Sallom Manager usando a nova Evolution API! O servidor foi atualizado com sucesso. 😉");

    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
