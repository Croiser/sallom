import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function simulateIncomingMessage() {
  try {
    // 1. Procurar por qualquer cliente que tenha 'douglas' no nome
    let client = await prisma.client.findFirst({
      where: {
        name: {
          contains: 'douglas',
          mode: 'insensitive'
        }
      }
    });

    if (!client) {
      console.log('Nenhum cliente com nome "douglas" encontrado. Pegando o primeiro cliente com telefone no banco para teste...');
      client = await prisma.client.findFirst({
        where: {
          phone: { not: '' }
        }
      });
    }

    if (!client) {
      console.log('Nenhum cliente válido encontrado no banco.');
      return;
    }

    console.log('Cliente selecionado para o teste:', client.name, 'Telefone:', client.phone);

    const ownerId = client.ownerUid; // A sessão do WAHA (O dono do salão)
    const clientPhone = (client.phone || '5511999999999').replace(/\D/g, ''); // Remover formatação
    
    // 2. Montar o payload simulando o webhook do WAHA (Mensagem Chegando)
    const payload = {
      event: 'message',
      session: ownerId,
      data: {
        id: 'false_' + clientPhone + '@c.us_3EB0' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        timestamp: Math.floor(Date.now() / 1000),
        from: clientPhone + '@c.us',
        fromMe: false, // Indica que a mensagem veio do cliente PARA o salão
        to: ownerId + '@c.us', // Número do salão (simulado com o ownerId)
        body: process.argv[2] || 'Olá, gostaria de agendar um horário para amanhã. Qual a disponibilidade?',
        hasMedia: false,
        ack: 1,
        vCards: [],
        notifyName: client.name,
        type: 'chat'
      }
    };

    console.log('\n=========================================');
    console.log('📩 SIMULANDO MENSAGEM CHEGANDO DO CLIENTE');
    console.log('=========================================');
    console.log('De (Cliente):', client.name, '(', clientPhone, ')');
    console.log('Para (Salão Session):', ownerId);
    console.log('Mensagem:', payload.data.body);
    console.log('=========================================\n');

    // 3. Fazer o POST para o servidor local (onde o app do salão está rodando)
    const PORT = process.env.PORT || 3000;
    const webhookUrl = `http://localhost:${PORT}/api/webhooks/waha`;
    
    try {
      console.log('Disparando Webhook para:', webhookUrl);
      const response = await axios.post(webhookUrl, payload);
      console.log('Resposta do Servidor (Webhook processado):', response.status, response.data);
    } catch (apiError) {
      if (apiError.response) {
        console.error('Erro no servidor ao processar Webhook:', apiError.response.status, apiError.response.data);
      } else {
        console.error('Erro de conexão. O servidor local está rodando na porta', PORT, '?');
        console.error(apiError.message);
      }
    }

  } catch (error) {
    console.error('Erro fatal no script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateIncomingMessage();
