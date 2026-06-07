import { prisma } from '../db';

export class CheckoutService {
  /**
   * Converte um Appointment (com seus Upsells) em uma Sale (Comanda).
   */
  static async checkoutAppointment(data: {
    appointmentId: string;
    ownerUid: string;
    paymentMethod?: string;
    extraServices?: Array<{
      serviceId: string;
      staffId: string;
    }>;
  }) {
    const { appointmentId, ownerUid, paymentMethod, extraServices } = data;

    // 1. Busca o agendamento e seus upsells
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, ownerUid },
      include: {
        upsells: {
          include: { service: true }
        },
        service: true,
      },
    });

    if (!appointment) {
      throw new Error("Agendamento não encontrado.");
    }

    // Valida se já existe Sale
    const existingSale = await prisma.sale.findUnique({
      where: { appointmentId }
    });

    if (existingSale) {
      throw new Error("Este agendamento já possui uma comanda/venda fechada.");
    }

    // Processa serviços extras adicionados exatamente na hora do pagamento (checkout)
    if (extraServices && extraServices.length > 0) {
      for (const extra of extraServices) {
        const service = await prisma.service.findFirst({
          where: { id: extra.serviceId, ownerUid }
        });
        
        if (!service) {
          throw new Error(`Serviço extra não encontrado: ${extra.serviceId}`);
        }

        const newUpsell = await prisma.appointmentUpsell.create({
          data: {
            appointmentId,
            serviceId: extra.serviceId,
            staffId: extra.staffId,
            price: service.price,
          }
        });

        // Adiciona ao array carregado na memória para ser processado no passo 2
        appointment.upsells.push({
          ...newUpsell,
          service
        } as any);
      }
    }

    // 2. Prepara os itens da comanda
    let totalAmount = 0;
    const saleItemsData = [];

    // 2.1 Item Principal
    totalAmount += appointment.price;
    saleItemsData.push({
      serviceId: appointment.serviceId,
      staffId: appointment.staffId,
      quantity: 1,
      unitPrice: appointment.price,
      totalPrice: appointment.price,
      isPaid: false, // Pode ser alterado se o agendamento teve pagamento online de sinal
    });

    // 2.2 Itens de Upsell
    for (const upsell of appointment.upsells) {
      totalAmount += upsell.price;
      saleItemsData.push({
        serviceId: upsell.serviceId,
        staffId: upsell.staffId, // Profissional específico do upsell
        quantity: 1,
        unitPrice: upsell.price,
        totalPrice: upsell.price,
        isPaid: false,
      });
    }

    // 3. Cria a Venda (Sale) e os Itens (SaleItem)
    const sale = await prisma.sale.create({
      data: {
        ownerUid,
        clientId: appointment.clientId,
        staffId: appointment.staffId, // Responsável principal
        appointmentId: appointment.id,
        totalAmount,
        paymentMethod: paymentMethod || 'hybrid',
        items: {
          create: saleItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // Atualiza status do appointment para completed
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { 
        status: 'completed',
        finishedAt: new Date()
      }
    });

    return sale;
  }
}
