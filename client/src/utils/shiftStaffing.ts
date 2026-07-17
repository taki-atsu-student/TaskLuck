import { Shift, BusinessInfo, BusinessDayKey } from '../models';

const HOLIDAYS = new Set([
  '2025-01-01','2025-01-13','2025-02-11','2025-02-23','2025-02-24','2025-03-20',
  '2025-04-29','2025-05-03','2025-05-04','2025-05-05','2025-05-06','2025-07-21',
  '2025-08-11','2025-09-15','2025-09-23','2025-10-13','2025-11-03','2025-11-23','2025-11-24',
  '2026-01-01','2026-01-12','2026-02-11','2026-02-23','2026-03-20','2026-04-29',
  '2026-05-03','2026-05-04','2026-05-05','2026-05-06','2026-07-20','2026-08-11',
  '2026-09-21','2026-09-22','2026-09-23','2026-10-12','2026-11-03',
]);

const DOW_TO_KEY: BusinessDayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function computeUnderstaffedDates(
  shifts: Shift[],
  businessInfo: BusinessInfo,
  todayIso: string,
): Set<string> {
  const result = new Set<string>();
  const today = new Date(`${todayIso}T00:00:00`);

  for (let i = 0; i < 28; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dow = d.getDay();
    const dayKey = DOW_TO_KEY[dow];

    if (businessInfo.regularClosedDays.includes(dayKey)) continue;

    const isHoliday = HOLIDAYS.has(dateKey) || dow === 0 || dow === 6;
    const dayShifts = shifts.filter((s) => s.date === dateKey && s.st === 'confirmed' && !s.isOff);

    for (const slot of businessInfo.timeSlotStaffing) {
      const required = isHoliday ? slot.holiday : slot.weekday;
      if (required <= 0) continue;

      const slotStartMin = parseInt(slot.id, 10) * 60;
      const slotEndMin = slotStartMin + 60;

      const count = dayShifts.filter((s) => {
        const [sh, sm] = s.s.split(':').map(Number);
        const [eh, em] = s.e.split(':').map(Number);
        return (sh * 60 + sm) < slotEndMin && (eh * 60 + em) > slotStartMin;
      }).length;

      if (count < required) {
        result.add(dateKey);
        break;
      }
    }
  }

  return result;
}
