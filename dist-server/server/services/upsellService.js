import prisma from '../db.js';
export class UpsellService {
    /**
     * Adiciona um serviço extra (upsell) a um agendamento existente.
     */
    static async addUpsell(data) {
        const { appointmentId, serviceId, staffId, ownerUid, force } = data;
        // 1. Validar se o serviço existe e pertence ao owner
        const service = await prisma.service.findFirst({
            where: { id: serviceId, ownerUid },
        });
        if (!service) {
            throw new Error("Serviço não encontrado.");
        }
        // 2. Validar se o serviço requer agendamento na grade
        if (service.requiresScheduling && !force) {
            throw new Error("Este serviço exige reserva de horário na agenda. Use force=true para adicionar como upsell.");
        }
        // 3. Validar se o profissional existe e pertence ao owner
        const staff = await prisma.staff.findFirst({
            where: { id: staffId, ownerUid },
        });
        if (!staff) {
            throw new Error("Profissional não encontrado.");
        }
        // 4. Validar o agendamento
        const appointment = await prisma.appointment.findFirst({
            where: { id: appointmentId, ownerUid },
        });
        if (!appointment) {
            throw new Error("Agendamento não encontrado.");
        }
        // 5. Criar o Upsell
        const upsell = await prisma.appointmentUpsell.create({
            data: {
                appointmentId,
                serviceId,
                staffId,
                price: service.price,
            },
        });
        return upsell;
    }
}
