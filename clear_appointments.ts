import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://sallonpromanager_user:sallonpromanager_password@127.0.0.1:5432/sallonpromanager_db?schema=public"
    }
  }
});

async function main() {
  try {
    console.log('Iniciando remoção de dados de agendamento (usando porta 5432)...');

    const deletedUpsells = await prisma.appointmentUpsell.deleteMany({});
    console.log(`Deletados ${deletedUpsells.count} upsells de agendamento.`);

    const updatedSales = await prisma.sale.updateMany({
      where: {
        appointmentId: { not: null }
      },
      data: {
        appointmentId: null
      }
    });
    console.log(`Atualizadas ${updatedSales.count} vendas (removido vínculo com agendamento).`);

    const deletedAppointments = await prisma.appointment.deleteMany({});
    console.log(`Deletados ${deletedAppointments.count} agendamentos.`);

    const deletedRecurrences = await prisma.recurrenceGroup.deleteMany({});
    console.log(`Deletados ${deletedRecurrences.count} grupos de recorrência.`);

    console.log('Dados de agendamento removidos com sucesso! Clientes mantidos intactos.');
  } catch (error) {
    console.error('Erro ao deletar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
