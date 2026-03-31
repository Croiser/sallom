import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const fromEmail = process.env.SMTP_FROM_EMAIL || '"Sallon Pro" <contato@sallon.dodile.com.br>';

export const emailService = {
  async sendWelcomeEmail(to: string, name: string, shopName: string, tempPassword?: string) {
    if (!process.env.SMTP_USER) {
      console.log(`[Email Mock] Welcome email mock to ${to} (${name})`);
      return;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #1a1a1a;">Bem-vindo(a) ao Sallon Pro, ${name}! 🎉</h2>
        <p>Estamos muito felizes em ter o <strong>${shopName}</strong> utilizando nossa plataforma.</p>
        <p>Seu espaço de gestão profissional já está pronto para uso.</p>
        
        <div style="background-color: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eaeaea;">
          <h3 style="margin-top: 0; color: #1a1a1a;">Suas Credenciais de Acesso:</h3>
          <p><strong>URL de Acesso:</strong> <a href="https://app.sallon.dodile.com.br" style="color: #e11d48; text-decoration: none;">app.sallon.dodile.com.br</a></p>
          <p><strong>E-mail:</strong> ${to}</p>
          ${tempPassword ? `<p><strong>Senha:</strong> ${tempPassword}</p>` : ''}
          ${tempPassword ? `<p style="font-size: 13px; color: #666; margin-top: 15px;"><em>Recomendamos que você altere esta senha após o seu primeiro acesso.</em></p>` : ''}
        </div>

        <p>Se precisar de ajuda para configurar sua barbearia/salão, nossa equipe de suporte está à disposição!</p>
        <br>
        <p>Um abraço,<br><strong>Equipe Sallon Pro</strong></p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: fromEmail,
        to,
        subject: `Bem-vindo ao Sallon Pro, ${name}!`,
        html,
      });
      console.log(`Welcome email successfully sent to ${to}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  },

  async sendPasswordResetEmail(to: string, token: string) {
    if (!process.env.SMTP_USER) {
      console.log(`[Email Mock] Password reset mock to ${to}. Token: ${token}`);
      return;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #1a1a1a;">Recuperação de Senha</h2>
        <p>Você solicitou a alteração da sua senha no Sallon Pro.</p>
        
        <div style="background-color: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid #eaeaea;">
          <p style="margin-top: 0; color: #666; font-size: 14px;">Utilize o código abaixo para redefinir sua senha:</p>
          <h1 style="color: #e11d48; letter-spacing: 4px; margin: 15px 0;">${token}</h1>
          <p style="font-size: 13px; color: #666; margin-bottom: 0;"><em>Este código expira em 1 hora.</em></p>
        </div>

        <p>Se você não solicitou esta alteração, ignore este e-mail.</p>
        <br>
        <p>Um abraço,<br><strong>Equipe Sallon Pro</strong></p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: fromEmail,
        to,
        subject: 'Recuperação de Senha - Sallon Pro',
        html,
      });
      console.log(`Password reset email successfully sent to ${to}`);
    } catch (error) {
      console.error('Error sending reset email:', error);
    }
  },

  async sendPaymentConfirmation(to: string, name: string, planName: string) {
    if (!process.env.SMTP_USER) {
      console.log(`[Email Mock] Payment confirmation mock to ${to}`);
      return;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #1a1a1a;">🎉 Pagamento Confirmado, ${name}!</h2>
        <p>Temos uma ótima notícia: o pagamento da sua assinatura do plano <strong>${planName}</strong> foi aprovado com sucesso.</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #dcfce7;">
          <h3 style="margin-top: 0; color: #166534;">Sua assinatura está ativa!</h3>
          <p style="color: #15803d; margin-bottom: 0;">Você já pode aproveitar todos os recursos do seu plano para gerenciar seu espaço da melhor forma possível.</p>
        </div>

        <p style="text-align: center; margin-top: 30px;">
          <a href="https://app.sallon.dodile.com.br" style="background-color: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Acessar meu Painel</a>
        </p>
        
        <br>
        <p>Caso tenha alguma dúvida, nossa equipe de suporte está à disposição!</p>
        <p>Um abraço,<br><strong>Equipe Sallon Pro</strong></p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: fromEmail,
        to,
        subject: 'Pagamento Confirmado - Sallon Pro',
        html,
      });
      console.log(`Payment confirmation email successfully sent to ${to}`);
    } catch (error) {
      console.error('Error sending payment confirmation:', error);
    }
  }
};
