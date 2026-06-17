export type Role = 'manager' | 'staff' | 'part';
export type ShiftStatus = 'confirmed' | 'request';
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'done';
export type Priority = 'high' | 'mid' | 'low';

export interface User {
  id: number;
  name: string;
  role: Role;
  xp: number;
  ini: string;
}

export interface Shift {
  id: number;
  uid: number;
  date: string;
  s: string;
  e: string;
  st: ShiftStatus;
  note?: string;
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
}

export interface GachaLog {
  name: string;
  xp: number;
}

export const USERS_INITIAL: User[] = [
  { id: 1, name: '田中 店長', role: 'manager', xp: 0, ini: '田' },
  { id: 2, name: '佐藤 花子', role: 'staff', xp: 320, ini: '佐' },
  { id: 3, name: '鈴木 一郎', role: 'part', xp: 180, ini: '鈴' },
  { id: 4, name: '高橋 美咲', role: 'part', xp: 90, ini: '高' },
  { id: 5, name: '山田 健太', role: 'part', xp: 230, ini: '山' },
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
