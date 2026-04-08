import { PrismaClient } from '@prisma/client';

export interface RecurrenceConflict {
  originalDate: string;         // "YYYY-MM-DD"
  reason: 'holiday' | 'closed_day' | 'overlap';
  holidayName?: string;
  overlappingAppointmentId?: string;
}

export interface RecurrenceValidationResult {
  hasConflicts: boolean;
  summary: {
    totalDates: number;
    validDates: number;
    conflictDates: number;
  };
  validDatesList: string[];
  conflicts: RecurrenceConflict[];
}

interface BusinessHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

interface Holiday {
  id: string;
  name: string;
  date: string; // "YYYY-MM-DD"
}

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
export async function validateRecurrenceSeries(
  ownerUid: string,
  staffId: string,
  startTimeStr: string,   // "HH:MM"
  durationMin: number,
  dayOfWeek: number,      // 0 = Sunday … 6 = Saturday
  seriesStart: Date,
  seriesEnd: Date,
  frequency: 'weekly' | 'biweekly',
  prisma: PrismaClient
): Promise<RecurrenceValidationResult> {

  // --- Load owner settings ---
  const settings = await prisma.setting.findUnique({ where: { uid: ownerUid } });
  const businessHours: BusinessHour[] = settings?.businessHours
    ? JSON.parse(settings.businessHours)
    : [];
  const holidays: Holiday[] = settings?.holidays
    ? JSON.parse(settings.holidays)
    : [];
  const holidaySet = new Set(holidays.map((h) => h.date));

  // --- Generate all dates in the series ---
  const allDates: Date[] = [];
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
  const validDatesList: string[] = [];
  const conflicts: RecurrenceConflict[] = [];

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

    const overlap = await (prisma.appointment as any).findFirst({
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
export async function calculateComboDuration(
  comboId: string,
  prisma: PrismaClient
): Promise<number> {
  const items = await (prisma as any).comboItem.findMany({
    where: { comboId },
    include: { service: true },
    orderBy: { order: 'asc' },
  });
  return items.reduce((total: number, item: any) => total + item.service.duration, 0);
}
