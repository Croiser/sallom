const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

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

    const ownerId = client.ownerUid;
    const settings = await prisma.whatsappSettings.findUnique({ where: { uid: ownerId } });
    const sessionName = settings?.wahaInstanceName || 'default';

    const apiUrl = process.env.WAHA_API_URL || 'http://waha:8080';
    const apiKey = process.env.WAHA_API_KEY || 'waha_secret_key_2024';
    
    let formattedChatId = client.phone.replace(/\D/g, '');
    if (formattedChatId.length === 10 || formattedChatId.length === 11) {
      formattedChatId = `55${formattedChatId}`;
    }

    console.log('Sending message to', formattedChatId, 'via session:', sessionName);

    const response = await axios.post(`${apiUrl}/message/sendText/${sessionName}`, {
      number: formattedChatId,
      options: {
        delay: 1200,
        presence: "composing"
      },
      textMessage: {
        text: "Olá Douglas, esta é uma mensagem de teste automático do sistema usando a nova Evolution API! O agendamento foi editado e os lembretes voltaram a funcionar isoladamente! 😉"
      }
    }, {
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json'
      }
    });

    console.log('Result:', response.data);
  } catch (error) {
    console.error('Error stringified:', JSON.stringify(error.response?.data, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

run();
