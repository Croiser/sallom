import prisma from '../db.js';
const DAY_NAMES_PT = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
];
/**
 * Universal appointment guard middleware.
 * Validates business hours, holidays, and slot overlap
 * before allowing any appointment to be created or updated.
 *
 * Requires req.body to include:
 *   - ownerUid  : string
 *   - staffId   : string
 *   - startTime : ISO datetime string
 *   - endTime   : ISO datetime string
 */
export async function appointmentGuard(req, res, next) {
    try {
        const { ownerUid, staffId, startTime, endTime, appointmentId } = req.body;
        if (!startTime || !endTime) {
            // Legacy appointments without startTime/endTime skip the guard
            return next();
        }
        const start = new Date(startTime);
        const end = new Date(endTime);
        // --- Load settings ---
        const settings = await prisma.setting.findUnique({ where: { uid: ownerUid } });
        const businessHours = settings?.businessHours
            ? JSON.parse(settings.businessHours)
            : [];
        const holidays = settings?.holidays
            ? JSON.parse(settings.holidays)
            : [];
        const dayName = DAY_NAMES_PT[start.getDay()];
        const dayConfig = businessHours.find((b) => b.day === dayName);
        // Check A — Closed day
        if (!dayConfig || dayConfig.closed) {
            res.status(422).json({
                error: 'BUSINESS_HOURS_VIOLATION',
                message: `O salão não funciona em ${dayName}`,
            });
            return;
        }
        // Check B — Public holiday
        const dateStr = start.toISOString().split('T')[0];
        const holiday = holidays.find((h) => h.date === dateStr);
        if (holiday) {
            res.status(422).json({
                error: 'HOLIDAY_VIOLATION',
                message: `Não é possível agendar em feriado: ${holiday.name}`,
            });
            return;
        }
        // Check C — Outside business hours
        const toMinutes = (h, m) => h * 60 + m;
        const [openH, openM] = dayConfig.open.split(':').map(Number);
        const [closeH, closeM] = dayConfig.close.split(':').map(Number);
        const startMins = toMinutes(start.getHours(), start.getMinutes());
        const endMins = toMinutes(end.getHours(), end.getMinutes());
        const openMins = toMinutes(openH, openM);
        const closeMins = toMinutes(closeH, closeM);
        if (startMins < openMins || endMins > closeMins) {
            res.status(422).json({
                error: 'OUTSIDE_BUSINESS_HOURS',
                message: `Horário fora do funcionamento (${dayConfig.open} – ${dayConfig.close})`,
            });
            return;
        }
        // Check D — Overlap with existing appointments
        const overlapWhere = {
            staffId,
            status: { not: 'cancelled' },
            startTime: { not: null },
            endTime: { not: null },
            AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
        };
        // Exclude the appointment being updated (for PUT requests)
        if (appointmentId) {
            overlapWhere.id = { not: appointmentId };
        }
        const overlap = await prisma.appointment.findFirst({
            where: overlapWhere,
            select: { id: true, clientName: true, startTime: true, endTime: true },
        });
        if (overlap) {
            res.status(409).json({
                error: 'TIME_SLOT_OVERLAP',
                message: 'Já existe um agendamento neste horário para este profissional',
                conflict: {
                    existingId: overlap.id,
                    clientName: overlap.clientName,
                    start: overlap.startTime,
                    end: overlap.endTime,
                },
            });
            return;
        }
        next();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
