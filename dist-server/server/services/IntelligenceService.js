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
        return {
            avgMonthlyRevenue,
            currentMonthRevenue: currentMonthRevenue._sum.price || 0,
            pendingExpenses: pendingExpenses._sum.amount || 0,
            breakEven: Math.max(0, breakEven),
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
}
