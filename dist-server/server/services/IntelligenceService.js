import prisma from '../db.js';
export class IntelligenceService {
    /**
     * Identifies clients at risk of churn based on their average visit interval.
     */
    static async getChurnRisk(ownerUid) {
        const clients = await prisma.client.findMany({
            where: { ownerUid },
            include: { appointments: { where: { status: 'completed' }, orderBy: { date: 'desc' } } }
        });
        const riskClients = clients.map(client => {
            const apps = client.appointments;
            if (apps.length < 2)
                return null;
            // Calculate average interval in days
            const intervals = [];
            for (let i = 0; i < apps.length - 1; i++) {
                const diff = new Date(apps[i].date).getTime() - new Date(apps[i + 1].date).getTime();
                intervals.push(diff / (1000 * 60 * 60 * 24));
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            // Check last visit vs now
            const lastVisit = new Date(apps[0].date);
            const daysSinceLastVisit = (new Date().getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceLastVisit > avgInterval * 1.5) {
                return {
                    id: client.id,
                    name: client.name,
                    phone: client.phone,
                    avgInterval: Math.round(avgInterval),
                    daysSinceLastVisit: Math.round(daysSinceLastVisit),
                    riskLevel: daysSinceLastVisit > avgInterval * 3 ? 'HIGH' : 'MEDIUM'
                };
            }
            return null;
        }).filter(c => c !== null);
        return riskClients;
    }
    /**
     * Projects monthly cash flow based on the last 3 months average.
     */
    static async getCashFlowProjection(ownerUid) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const pastAppointments = await prisma.appointment.findMany({
            where: { ownerUid, status: 'completed', date: { gte: threeMonthsAgo.toISOString() } }
        });
        const totalRevenue = pastAppointments.reduce((acc, app) => acc + (app.price || 0), 0);
        const avgMonthlyRevenue = totalRevenue / 3;
        const currentMonthStart = new Date();
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);
        const currentMonthRevenue = await prisma.appointment.aggregate({
            where: { ownerUid, status: 'completed', date: { gte: currentMonthStart.toISOString() } },
            _sum: { price: true }
        });
        const pendingExpenses = await prisma.transaction.aggregate({
            where: { ownerUid, type: 'expense', status: 'pending', date: { gte: currentMonthStart.toISOString() } },
            _sum: { amount: true }
        });
        const breakEven = (pendingExpenses._sum.amount || 0) - (currentMonthRevenue._sum.price || 0);
        const breakEvenProgress = (pendingExpenses._sum.amount || 0) > 0
            ? Math.min(100, ((currentMonthRevenue._sum.price || 0) / (pendingExpenses._sum.amount || 0)) * 100)
            : 100;
        return {
            avgMonthlyRevenue,
            currentMonthRevenue: currentMonthRevenue._sum.price || 0,
            pendingExpenses: pendingExpenses._sum.amount || 0,
            breakEven: Math.max(0, breakEven),
            gapToExpenses: Math.max(0, breakEven),
            breakEvenProgress,
            isHealthy: breakEven <= 0,
            projectionStatus: (currentMonthRevenue._sum.price || 0) >= avgMonthlyRevenue ? 'ABOVE_AVG' : 'BELOW_AVG'
        };
    }
    /**
     * Suggests upsell products based on client history or service.
     */
    static async getUpsellSuggestions(ownerUid, clientId) {
        // Basic logic: suggest top products or products related to last services
        const products = await prisma.product.findMany({
            where: { ownerUid, stock: { gt: 0 } },
            take: 3
        });
        return products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            reason: 'Produto mais vendido no salão'
        }));
    }
    /**
     * Processa mensagens recebidas pelo WhatsApp usando Inteligência Artificial
     */
    static async handleIncomingMessage(uid, from, text) {
        try {
            // 1. Obter configurações de IA do salão e os dados do usuário (dono) para pegar o slug (link)
            const settings = await prisma.whatsappSettings.findUnique({
                where: { uid },
                include: { user: true } // Pegar o slug do salão
            });
            if (!settings || !settings.aiEnabled || !settings.enabled)
                return;
            // 2. Obter histórico recente da conversa (últimas 5 mensagens)
            const recentMessages = await prisma.whatsappMessage.findMany({
                where: { ownerUid: uid, recipientNumber: from },
                orderBy: { createdAt: 'desc' },
                take: 5
            });
            recentMessages.reverse(); // Ordem cronológica
            let chatHistory = recentMessages.map(m => `${m.direction === 'inbound' ? 'Cliente' : 'Você'}: ${m.content}`).join('\n');
            // 3. Montar o prompt
            const systemPrompt = settings.aiPrompt || 'Você é um assistente virtual amigável para um salão de beleza. Seja cordial e tente ajudar o cliente a agendar um horário ou tirar dúvidas.';
            // Montar o link real de agendamento do salão
            const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
            const shopSlug = settings.user.slug || '';
            const bookingLink = `${baseUrl}/${shopSlug}`;
            const fullPrompt = `Instruções do Salão:\n${systemPrompt}\n\nREGRA ABSOLUTA OBRIGATÓRIA: Se o cliente quiser agendar ou pedir o link, entregue EXATAMENTE este link real de agendamento: ${bookingLink}\nNUNCA invente links falsos ou use [link]. Use APENAS a URL informada acima.\n\nHistórico Recente:\n${chatHistory}\n\nCliente (nova mensagem): ${text}\nVocê (assistente):`;
            let aiResponseText = '';
            // 4. Chamar a API da IA escolhida (ex: Google Gemini)
            // Estamos usando o provider 'gemini' por padrão. Se houver integração com openAI configurada, podemos usar.
            if (settings.aiProvider === 'gemini') {
                const { GoogleGenAI } = await import("@google/genai");
                // Requer GEMINI_API_KEY no .env
                if (!process.env.GEMINI_API_KEY) {
                    console.error('[IntelligenceService] GEMINI_API_KEY não configurada.');
                    return;
                }
                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: fullPrompt,
                });
                aiResponseText = response.text || '';
            }
            else {
                // Fallback or OpenAI implementation
                aiResponseText = "Desculpe, a integração com esta IA ainda não está disponível.";
            }
            aiResponseText = aiResponseText.trim();
            if (!aiResponseText)
                return;
            // 5. Enviar a resposta gerada de volta ao cliente via WAHA
            const { WAHAService } = await import('../waha.js');
            const waha = new WAHAService(process.env.WAHA_API_URL || 'http://localhost:3000');
            const fullFrom = from.includes('@c.us') ? from : `${from}@c.us`;
            await waha.sendTextMessage(settings.wahaInstanceName || 'default', fullFrom, aiResponseText);
            // 6. Salvar a resposta no histórico de conversas
            await prisma.whatsappMessage.create({
                data: {
                    ownerUid: uid,
                    recipientNumber: from,
                    content: aiResponseText,
                    type: 'text',
                    status: 'sent',
                    direction: 'outbound'
                }
            });
        }
        catch (err) {
            console.error('[IntelligenceService] Erro ao processar mensagem com IA:', err);
        }
    }
}
