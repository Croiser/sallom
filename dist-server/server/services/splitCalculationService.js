import prisma from '../db.js';
export class SplitCalculationService {
    /**
     * Calcula o split (divisão financeira) por Item da Comanda (SaleItem).
     */
    static async calculateSaleSplit(saleId, ownerUid, machineFeePercentage = 0) {
        const sale = await prisma.sale.findFirst({
            where: { id: saleId, ownerUid },
            include: {
                items: {
                    include: {
                        staff: true,
                        service: true,
                        product: true
                    }
                }
            }
        });
        if (!sale) {
            throw new Error("Comanda/Venda não encontrada.");
        }
        const splits = [];
        for (const item of sale.items) {
            // Se não tem staff vinculado, 100% vai pro salão
            const commissionPercentage = item.staff?.commissionPercentage || 0;
            const grossValue = item.totalPrice;
            // Desconta a taxa da maquininha antes do split (regra comum no Brasil)
            const feeAmount = grossValue * (machineFeePercentage / 100);
            const netValueAfterFee = grossValue - feeAmount;
            // Calcula a fatia do profissional sobre o valor líquido
            const professionalShare = netValueAfterFee * (commissionPercentage / 100);
            const salonShare = netValueAfterFee - professionalShare;
            splits.push({
                staffId: item.staffId || 'none',
                staffName: item.staff?.name || 'Salão',
                serviceId: item.serviceId,
                productId: item.productId,
                saleItemId: item.id,
                grossValue,
                netValueAfterFee,
                salonShare,
                professionalShare,
                commissionPercentage
            });
        }
        return splits;
    }
}
