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
  validDatesList: { date: string; startTime: string }[];
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
 * Helper to find a free time slot on a specific day
 */
async function findFreeTimeOnDay(
  date: Date,
  staffId: string,
  durationMin: number,
  businessHour: BusinessHour,
  prisma: PrismaClient
): Promise<string | null> {
  const [openH, openM] = businessHour.open.split(':').map(Number);
  const [closeH, closeM] = businessHour.close.split(':').map(Number);
  
  let currentStart = new Date(date);
  currentStart.setHours(openH, openM, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(closeH, closeM, 0, 0);

  while (true) {
    const currentEnd = new Date(currentStart.getTime() + durationMin * 60_000);
    if (currentEnd > endOfDay) {
      break;
    }

    const overlap = await (prisma.appointment as any).findFirst({
      where: {
        staffId,
        status: { not: 'cancelled' },
        AND: [
          { startTime: { lt: currentEnd } },
          { endTime: { gt: currentStart } },
        ],
      },
      select: { id: true },
    });

    if (!overlap) {
      const h = currentStart.getHours().toString().padStart(2, '0');
      const m = currentStart.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    }

    currentStart.setMinutes(currentStart.getMinutes() + 15);
  }
  return null;
}

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
  frequency: string,
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

  const isCustom = frequency.startsWith('custom_');
  const customDays = isCustom ? parseInt(frequency.split('_')[1] || '20', 10) : 0;

  // Advance cursor to the first matching day of week if not custom
  if (!isCustom) {
    while (cursor.getDay() !== dayOfWeek) {
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const stepDays = isCustom ? customDays : (frequency === 'biweekly' ? 14 : 7);
  while (cursor <= seriesEnd) {
    allDates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + stepDays);
  }

  // --- Validate each date ---
  const validDatesList: { date: string; startTime: string }[] = [];
  const conflicts: RecurrenceConflict[] = [];

  const [startH, startM] = startTimeStr.split(':').map(Number);

  for (const date of allDates) {
    let testDate = new Date(date);
    const originalDateStr = date.toISOString().split('T')[0];
    let dayConfig: BusinessHour | undefined;

    // 1. Find an open day
    while (true) {
      const dateStr = testDate.toISOString().split('T')[0];
      const dayName = DAY_NAMES_PT[testDate.getDay()];
      dayConfig = businessHours.find((b) => b.day === dayName);

      if (!dayConfig || dayConfig.closed || holidaySet.has(dateStr)) {
        testDate.setDate(testDate.getDate() + 1);
      } else {
        break;
      }
    }

    const finalDateStr = testDate.toISOString().split('T')[0];

    // 2. Check original time on the open day
    const apptStart = new Date(testDate);
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

    if (!overlap) {
      validDatesList.push({ date: finalDateStr, startTime: startTimeStr });
      continue;
    }

    // 3. Time is overlapped, try finding next available slot
    const freeTimeStr = await findFreeTimeOnDay(testDate, staffId, durationMin, dayConfig!, prisma);
    
    if (freeTimeStr) {
      validDatesList.push({ date: finalDateStr, startTime: freeTimeStr });
    } else {
      conflicts.push({
        originalDate: originalDateStr,
        reason: 'overlap',
        overlappingAppointmentId: overlap.id,
      });
    }
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
