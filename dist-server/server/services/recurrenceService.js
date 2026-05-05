// Portuguese day names matching the existing Settings format
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
 * Generates all dates for a recurring series and validates each one
 * against business hours, holidays and existing appointments.
 */
export async function validateRecurrenceSeries(ownerUid, staffId, startTimeStr, // "HH:MM"
durationMin, dayOfWeek, // 0 = Sunday … 6 = Saturday
seriesStart, seriesEnd, frequency, prisma) {
    // --- Load owner settings ---
    const settings = await prisma.setting.findUnique({ where: { uid: ownerUid } });
    const businessHours = settings?.businessHours
        ? JSON.parse(settings.businessHours)
        : [];
    const holidays = settings?.holidays
        ? JSON.parse(settings.holidays)
        : [];
    const holidaySet = new Set(holidays.map((h) => h.date));
    // --- Generate all dates in the series ---
    const allDates = [];
    const cursor = new Date(seriesStart);
    // Advance cursor to the first matching day of week
    while (cursor.getDay() !== dayOfWeek) {
        cursor.setDate(cursor.getDate() + 1);
    }
    const stepDays = frequency === 'biweekly' ? 14 : 7;
    while (cursor <= seriesEnd) {
        allDates.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + stepDays);
    }
    // --- Validate each date ---
    const validDatesList = [];
    const conflicts = [];
    const [startH, startM] = startTimeStr.split(':').map(Number);
    for (const date of allDates) {
        const dateStr = date.toISOString().split('T')[0];
        const dayName = DAY_NAMES_PT[date.getDay()];
        const dayConfig = businessHours.find((b) => b.day === dayName);
        // Check 1 — Closed day in settings
        if (!dayConfig || dayConfig.closed) {
            conflicts.push({ originalDate: dateStr, reason: 'closed_day' });
            continue;
        }
        // Check 2 — Public holiday
        if (holidaySet.has(dateStr)) {
            const holiday = holidays.find((h) => h.date === dateStr);
            conflicts.push({
                originalDate: dateStr,
                reason: 'holiday',
                holidayName: holiday?.name,
            });
            continue;
        }
        // Check 3 — Overlap with existing appointments
        const apptStart = new Date(date);
        apptStart.setHours(startH, startM, 0, 0);
        const apptEnd = new Date(apptStart.getTime() + durationMin * 60_000);
        const overlap = await prisma.appointment.findFirst({
            where: {
                staffId,
                status: { not: 'cancelled' },
                AND: [
                    { startTime: { lt: apptEnd } },
                    { endTime: { gt: apptStart } },
                ],
            },
            select: { id: true },
        });
        if (overlap) {
            conflicts.push({
                originalDate: dateStr,
                reason: 'overlap',
                overlappingAppointmentId: overlap.id,
            });
            continue;
        }
        validDatesList.push(dateStr);
    }
    return {
        hasConflicts: conflicts.length > 0,
        summary: {
            totalDates: allDates.length,
            validDates: validDatesList.length,
            conflictDates: conflicts.length,
        },
        validDatesList,
        conflicts,
    };
}
/**
 * Calculates the total duration of a combo from its items.
 */
export async function calculateComboDuration(comboId, prisma) {
    const items = await prisma.comboItem.findMany({
        where: { comboId },
        include: { service: true },
        orderBy: { order: 'asc' },
    });
    return items.reduce((total, item) => total + item.service.duration, 0);
}
