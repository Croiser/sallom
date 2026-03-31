import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env explicitly for this test
config({ path: resolve(process.cwd(), '.env') });

import { emailService } from '../server/email.js';

async function testEmail() {
  console.log("Variáveis de Ambiente Atuais:");
  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("SMTP_USER:", process.env.SMTP_USER);

  try {
    console.log("Disparando e-mail de teste de Boas-Vindas para a própria conta do Gmail...");
    await emailService.sendWelcomeEmail(
      'sallonpromanager.dodile@gmail.com',
      'Testador',
      'Sallon Pro Manager',
      '123456'
    );
    console.log("Teste finalizado com sucesso!");
  } catch (err) {
    console.error("Erro durante o teste:", err);
  }
}

testEmail();
