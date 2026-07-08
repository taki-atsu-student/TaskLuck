export type Role = 'manager' | 'staff' | 'part';

export const normalizeRole = (role?: string | null): Role => {
  const normalized = String(role ?? '').trim().toLowerCase();
  if (normalized === 'manager' || normalized === 'staff' || normalized === 'part') {
    return normalized;
  }

  if (normalized === 'admin') {
    return 'manager';
  }

  return 'staff';
};

export const resolveUserRole = (user: { role?: string | null; hourlyWage?: number | null; monthlySalary?: number | null }): Role => {
  const normalized = normalizeRole(user.role);
  if (normalized === 'manager') {
    return normalized;
  }

  const hourlyWage = Number(user.hourlyWage ?? 0);
  const monthlySalary = Number(user.monthlySalary ?? 0);

  if (hourlyWage > 0 && monthlySalary <= 0) {
    return 'part';
  }

  if (monthlySalary > 0 && hourlyWage <= 0) {
    return 'staff';
  }

  return normalized === 'part' ? 'part' : 'staff';
};
export type ShiftStatus = 'confirmed' | 'request';
export type ShiftAssignment = 'hall' | 'kitchen';
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'done';
export type Priority = 'high' | 'mid' | 'low';

export interface ExtraWage {
  id: number;
  title: string;
  amount: number;
  _new?: boolean;
}

export interface User {
  id: number;
  name: string;
  username: string;
  role: Role;
  xp: number;
  ini: string;
  password: string;
  hourlyWage?: number;
  extraWages?: ExtraWage[];
  monthlySalary?: number;
}

export interface Shift {
  id: number;
  uid: number;
  date: string;
  s: string;
  e: string;
  st: ShiftStatus;
  isOff?: boolean;
  assignments?: ShiftAssignment[];
}

export interface ShiftPattern {
  id: number;
  title: string;
  workStart: string;
  workEnd: string;
  breakTime: number;
  memo: string;
}

export interface Task {
  id: number;
  name: string;
  desc: string;
  pri: Priority;
  xp: number;
  st: TaskStatus;
  to: number | null;
  by: number;
  inPool?: boolean;
}

export interface GachaLog {
  name: string;
  xp: number;
  timestamp?: number;
  rarity?: string;
  rkey?: string;
  time?: string;
}

export interface Notification {
  id: number;
  title: string;
  sub: string;
  read: boolean;
  uid: number;
  taskId?: number;
}

export type BusinessDayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' | 'holiday';
export type SpecialBusinessType = 'closed' | 'specialClosed' | 'shortHours';

export interface BusinessHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface StaffingRequirement {
  normal: number;
  busy: number;
}

export interface TimeSlotStaffing {
  id: string;
  label: string;
  weekday: number;
  holiday: number;
}

export interface SpecialBusinessRule {
  id: number;
  date: string;
  type: SpecialBusinessType;
  time: string;
  note: string;
}

export interface BusinessInfo {
  regularClosedDays: BusinessDayKey[];
  hours: Record<BusinessDayKey, BusinessHours>;
  staffing: Record<BusinessDayKey, StaffingRequirement>;
  timeSlotStaffing: TimeSlotStaffing[];
  requiredBreakMinutes: number;
  maxWorkHours: number;
  maxConsecutiveWorkDays: number;
  minStaff: number;
  specialRules: SpecialBusinessRule[];
}

export const BUSINESS_INFO_INITIAL: BusinessInfo = {
  regularClosedDays: ['wed'],
  requiredBreakMinutes: 60,
  maxWorkHours: 8,
  maxConsecutiveWorkDays: 5,
  minStaff: 2,
  hours: {
    mon: { open: '10:00', close: '20:00', closed: false },
    tue: { open: '10:00', close: '20:00', closed: false },
    wed: { open: '10:00', close: '20:00', closed: true },
    thu: { open: '10:00', close: '20:00', closed: false },
    fri: { open: '10:00', close: '20:00', closed: false },
    sat: { open: '12:00', close: '20:00', closed: false },
    sun: { open: '18:00', close: '20:00', closed: false },
    holiday: { open: '10:00', close: '20:00', closed: false },
  },
  staffing: {
    mon: { normal: 2, busy: 3 },
    tue: { normal: 2, busy: 3 },
    wed: { normal: 0, busy: 0 },
    thu: { normal: 2, busy: 3 },
    fri: { normal: 3, busy: 4 },
    sat: { normal: 4, busy: 5 },
    sun: { normal: 4, busy: 5 },
    holiday: { normal: 4, busy: 5 },
  },
  timeSlotStaffing: [
    { id: '6', label: '6:00 - 7:00', weekday: 0, holiday: 0 },
    { id: '7', label: '7:00 - 8:00', weekday: 0, holiday: 0 },
    { id: '8', label: '8:00 - 9:00', weekday: 0, holiday: 0 },
    { id: '9', label: '9:00 - 10:00', weekday: 0, holiday: 0 },
    { id: '10', label: '10:00 - 11:00', weekday: 2, holiday: 3 },
    { id: '11', label: '11:00 - 12:00', weekday: 3, holiday: 4 },
    { id: '12', label: '12:00 - 13:00', weekday: 3, holiday: 4 },
    { id: '13', label: '13:00 - 14:00', weekday: 0, holiday: 0 },
    { id: '14', label: '14:00 - 15:00', weekday: 0, holiday: 0 },
    { id: '15', label: '15:00 - 16:00', weekday: 0, holiday: 0 },
    { id: '16', label: '16:00 - 17:00', weekday: 0, holiday: 0 },
    { id: '17', label: '17:00 - 18:00', weekday: 0, holiday: 0 },
    { id: '18', label: '18:00 - 19:00', weekday: 0, holiday: 0 },
    { id: '19', label: '19:00 - 20:00', weekday: 0, holiday: 0 },
    { id: '20', label: '20:00 - 21:00', weekday: 0, holiday: 0 },
    { id: '21', label: '21:00 - 22:00', weekday: 0, holiday: 0 },
    { id: '22', label: '22:00 - 23:00', weekday: 0, holiday: 0 },
    { id: '23', label: '23:00 - 24:00', weekday: 0, holiday: 0 },
  ],
  specialRules: [
    { id: 1, date: '2024-08-15', type: 'specialClosed', time: '-', note: 'お盆休み' },
    { id: 2, date: '2024-08-16', type: 'specialClosed', time: '10:00-17:00', note: '' },
    { id: 3, date: '2024-12-24', type: 'shortHours', time: '10:00-17:00', note: 'クリスマス' },
  ],
};

