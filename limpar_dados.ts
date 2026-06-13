import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando limpeza de dados (Agendamentos e Financeiro)...');

    // 1. DADOS DE AGENDAMENTO
    console.log('Limpando agendamentos...');
    await prisma.appointmentUpsell.deleteMany({});
    
    await prisma.sale.updateMany({
      where: { appointmentId: { not: null } },
      data: { appointmentId: null }
    });
    
    await prisma.appointment.deleteMany({});
    await prisma.recurrenceGroup.deleteMany({});

    // 2. DADOS FINANCEIROS
    console.log('Limpando dados financeiros...');
    await prisma.saleItem.deleteMany({});
    await prisma.sale.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.walletTransaction.deleteMany({});
    
    await prisma.wallet.updateMany({
      data: { balance: 0 }
    });

    console.log('==============================================');
    console.log('Limpeza concluída com sucesso!');
    console.log('Agendamentos, vendas, transações e saldo das carteiras foram zerados.');
    console.log('Clientes, usuários, serviços e configurações foram mantidos.');
    console.log('==============================================');
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
