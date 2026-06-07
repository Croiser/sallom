import cron from 'node-cron';
import prisma from '../db.js';
// Mantenha o estado em memória dos IDs de agendamento já lembrados para evitar duplicação em caso de overlap
const sentReminders = new Set();
export function initReminderCron() {
    // Roda a cada 30 minutos (nos minutos 00 e 30)
    cron.schedule('*/30 * * * *', async () => {
        try {
            console.log('[Cron] Verificando agendamentos para envio de lembretes...');
            const now = new Date();
            // Look for appointments happening in 1 to 2 hours
            const windowStart = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
            const windowEnd = new Date(now.getTime() + 120 * 60 * 1000); // +2 hours
            const upcomingAppointments = await prisma.appointment.findMany({
                where: {
                    status: 'scheduled',
                    date: {
                        gte: windowStart,
                        lt: windowEnd
                    }
                },
                include: {
                    owner: true
                }
            });
            console.log(`[Cron] Encontrou ${upcomingAppointments.length} agendamentos na janela.`);
            for (const app of upcomingAppointments) {
                if (sentReminders.has(app.id))
                    continue;
                if (!app.phone)
                    continue;
                const uid = app.ownerUid;
                const settings = await prisma.whatsappSettings.findUnique({ where: { uid } });
                if (settings && settings.enabled) {
                    const templates = settings.templates ? JSON.parse(settings.templates) : {};
                    let templateStr = templates['reminder'];
                    if (templateStr) {
                        const variables = {
                            nome_cliente: app.clientName,
                            shop_name: app.owner?.shopName || 'nosso salão',
                            data: new Date(app.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
                            hora: new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
                        };
                        let text = templateStr;
                        Object.keys(variables).forEach(key => {
                            const regex = new RegExp(`{${key}}`, 'g');
                            text = text.replace(regex, variables[key]);
                        });
                        try {
                            const { whatsappQueueService } = await import('./whatsappQueueService.js');
                            await whatsappQueueService.enqueueMessage({
                                ownerUid: uid,
                                recipientNumber: app.phone,
                                recipientName: app.clientName,
                                content: text,
                                type: 'reminder'
                            });
                            console.log(`[Cron] Lembrete enfileirado para ${app.clientName} (${app.phone})`);
                            sentReminders.add(app.id);
                        }
                        catch (err) {
                            console.error(`[Cron] Falha ao enfileirar lembrete para ${app.clientName}:`, err.message);
                        }
                    }
                }
            }
            // Cleanup do Set em memória (remover IDs de agendamentos que já passaram da janela de 2 horas)
            sentReminders.forEach(async (id) => {
                const app = await prisma.appointment.findUnique({ where: { id }, select: { date: true } });
                if (!app || new Date(app.date).getTime() < now.getTime()) {
                    sentReminders.delete(id);
                }
            });
        }
        catch (err) {
            console.error('[Cron] Erro na execução:', err.message);
        }
    });
    console.log('[Cron] Serviço de lembretes inicializado.');
}
