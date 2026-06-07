import cron from 'node-cron';
import prisma from '../db.js';
import { WAHAService } from '../waha.js';
import { WhatsAppMetaService } from '../whatsappMeta.js';
const MAX_RETRIES = 3;
export function initWhatsappWorker() {
    // Roda a cada 1 minuto
    cron.schedule('*/1 * * * *', async () => {
        try {
            // Find up to 50 pending messages
            const pendingMessages = await prisma.whatsappMessage.findMany({
                where: {
                    status: 'pending',
                    direction: 'outbound',
                },
                take: 50,
                orderBy: {
                    createdAt: 'asc'
                }
            });
            if (pendingMessages.length === 0)
                return;
            console.log(`[WhatsApp Worker] Processando ${pendingMessages.length} mensagens pendentes...`);
            for (const msg of pendingMessages) {
                if (!msg.recipientNumber || !msg.content) {
                    await prisma.whatsappMessage.update({
                        where: { id: msg.id },
                        data: { status: 'failed' }
                    });
                    continue;
                }
                try {
                    const settings = await prisma.whatsappSettings.findUnique({
                        where: { uid: msg.ownerUid }
                    });
                    if (!settings || !settings.enabled) {
                        await prisma.whatsappMessage.update({
                            where: { id: msg.id },
                            data: { status: 'failed' }
                        });
                        continue;
                    }
                    let success = false;
                    // Check if Meta API or WAHA is chosen
                    if (settings.provider === 'meta' && settings.apiKey && settings.phoneNumberId) {
                        const metaService = new WhatsAppMetaService(settings.apiKey, settings.phoneNumberId);
                        if (msg.type === 'template') {
                            await metaService.sendTextMessage(msg.recipientNumber, msg.content);
                        }
                        else {
                            await metaService.sendTextMessage(msg.recipientNumber, msg.content);
                        }
                        success = true;
                    }
                    else {
                        // Use WAHA
                        const WAHA_API_URL = process.env.WAHA_API_URL || 'http://waha:3000';
                        const waha = new WAHAService(WAHA_API_URL);
                        let formattedNumber = msg.recipientNumber.replace(/\D/g, '');
                        if (!formattedNumber.startsWith('55'))
                            formattedNumber = '55' + formattedNumber;
                        const chatId = `${formattedNumber}@c.us`;
                        // Utilize proper session name (wahaInstanceName is UID for multi-tenant)
                        const sessionName = settings.wahaInstanceName || msg.ownerUid || 'default';
                        await waha.sendTextMessage(sessionName, chatId, msg.content);
                        success = true;
                    }
                    if (success) {
                        await prisma.whatsappMessage.update({
                            where: { id: msg.id },
                            data: { status: 'sent' }
                        });
                        console.log(`[WhatsApp Worker] Mensagem enviada com sucesso (ID: ${msg.id})`);
                    }
                }
                catch (error) {
                    console.error(`[WhatsApp Worker] Falha ao enviar mensagem (ID: ${msg.id}):`, error.message);
                    const newRetryCount = msg.retryCount + 1;
                    const newStatus = newRetryCount >= MAX_RETRIES ? 'failed' : 'pending';
                    await prisma.whatsappMessage.update({
                        where: { id: msg.id },
                        data: {
                            status: newStatus,
                            retryCount: newRetryCount
                        }
                    });
                }
            }
        }
        catch (err) {
            console.error('[WhatsApp Worker] Erro geral na execução:', err.message);
        }
    });
    console.log('[WhatsApp Worker] Serviço de retentativas inicializado.');
}
