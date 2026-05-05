import axios from 'axios';

async function main() {
  const chatId = '5545999959186@c.us';
  const text = 'Lembrete: Você tem um agendamento na Salão Pro Manager dia 03/05/2026 às 14:00. Até logo!';
  
  try {
    const res = await axios.post('http://187.77.45.37:3006/api/sendText', {
      session: 'default',
      chatId,
      text
    }, {
      headers: {
        'X-Api-Key': 'waha_secret_key_2024',
        'Accept': 'application/json'
      }
    });
    console.log('Mensagem enviada:', res.data);
  } catch (err) {
    console.error('Erro ao enviar:', err.response?.data || err.message);
  }
}

main().catch(console.error);
