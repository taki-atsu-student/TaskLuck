export type Role = 'manager' | 'staff' | 'part';
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

export const USERS_INITIAL: User[] = [
  { id: 1, username: 'tanaka_manager', name: '田中 店長', role: 'manager', xp: 0, ini: '田', password: 'pass0001', monthlySalary: 350010 },
  { id: 2, username: 'sato_manager', name: '佐藤 花子', role: 'staff', xp: 320, ini: '佐', password: 'pass0002', monthlySalary: 250010 },
  { id: 3, username: 'suzuki_ichiro', name: '鈴木 一郎', role: 'part', xp: 180, ini: '鈴', password: 'pass0003', hourlyWage: 1100 },
  { id: 4, username: 'takahashi_misaki', name: '高橋 美咲', role: 'part', xp: 90, ini: '高', password: 'pass0004', hourlyWage: 1050 },
  { id: 5, username: 'yamada_kenta', name: '山田 健太', role: 'part', xp: 230, ini: '山', password: 'pass0005', hourlyWage: 1100 },
];


export const SHIFTS_INITIAL: Shift[] = [
  { id: 1, uid: 3, date: '2025-06-09', s: '10:00', e: '17:00', st: 'confirmed' },
  { id: 2, uid: 4, date: '2025-06-09', s: '11:00', e: '18:00', st: 'confirmed' },
  { id: 3, uid: 5, date: '2025-06-09', s: '13:00', e: '20:00', st: 'confirmed' },
  { id: 4, uid: 2, date: '2025-06-10', s: '09:00', e: '17:00', st: 'confirmed' },
  { id: 5, uid: 3, date: '2025-06-11', s: '10:00', e: '17:00', st: 'request' },
  { id: 6, uid: 4, date: '2025-06-14', s: '12:00', e: '19:00', st: 'confirmed' },
  { id: 7, uid: 5, date: '2025-06-16', s: '10:00', e: '16:00', st: 'confirmed' },
];

export const TASKS_INITIAL: Task[] = [
  { id: 1, name: '在庫チェック（飲料）', desc: '冷蔵庫・棚の在庫を確認', pri: 'high', xp: 80, st: 'pending', to: null, by: 1 },
  { id: 2, name: 'フロア清掃', desc: '開店前にフロア全体を拭き掃除', pri: 'mid', xp: 50, st: 'in_progress', to: 3, by: 1 },
  { id: 3, name: '陳列棚の整理', desc: '商品を正しい位置に戻す', pri: 'low', xp: 40, st: 'review', to: 4, by: 2 },
  { id: 4, name: 'バックヤード片付け', desc: '段ボールをまとめて廃棄場所へ', pri: 'mid', xp: 60, st: 'pending', to: null, by: 1 },
  { id: 5, name: 'レジ補充', desc: 'つり銭用コインの補充', pri: 'high', xp: 70, st: 'done', to: 5, by: 2 },
  { id: 6, name: '窓ふき', desc: '店舗入口の窓を清掃', pri: 'low', xp: 40, st: 'pending', to: null, by: 1 },
];

export const SHIFT_PATTERNS_INITIAL: ShiftPattern[] = [
  { id: 1, title: 'パターンA', workStart: '17:00', workEnd: '21:00', breakTime: 0, memo: '平日用' },
  { id: 2, title: 'パターンB', workStart: '13:00', workEnd: '21:00', breakTime: 60, memo: '休日用' },
];
