import type { Shift, Task, TaskStatus, User } from '../models';

export const buildDashboardStats = (shifts: Shift[], tasks: Task[], currentUser: User | null, todayIso: string) => {
  const todShifts = shifts.filter((shift) => shift.date === todayIso && shift.st === 'confirmed');
  const myTasks = currentUser ? tasks.filter((task) => task.to === currentUser.id && task.st !== 'done') : [];

  return { todShifts, myTasks };
};

export const buildTodayShifts = (shifts: Shift[], users: User[], currentUser: User | null, todayIso: string) => {
  const todShifts = shifts.filter((shift) => shift.date === todayIso && shift.st === 'confirmed');
  if (!todShifts.length) {
    return null;
  }

  return todShifts.map((shift) => {
    const user = users.find((item) => item.id === shift.uid) ?? { name: '?', ini: '?' };
    const isMine = shift.uid === currentUser?.id;
    return { shift, user, isMine };
  });
};

export const buildDashboardTasks = (tasks: Task[], currentUser: User | null, isMgr: boolean) => {
  if (!currentUser) return null;
  const showT = isMgr ? tasks.filter((task) => task.st !== 'done').slice(0, 5) : tasks.filter((task) => task.to === currentUser.id && task.st !== 'done').slice(0, 5);
  return showT;
};

export const buildCalendarModel = (cyState: number, cmState: number, shifts: Shift[], currentUser: User | null, todayIso: string) => {
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const firstDay = new Date(cyState, cmState, 1).getDay();
  const daysInMonth = new Date(cyState, cmState + 1, 0).getDate();
  const prevMonthDays = new Date(cyState, cmState, 0).getDate();
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const cells: any[] = [];

  for (let i = 0; i < firstDay; i += 1) {
    const dateNumber = prevMonthDays - firstDay + 1 + i;
    cells.push({ type: 'prev', dateNumber });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${cyState}-${String(cmState + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayShifts = shifts.filter((shift) => shift.date === dateKey && shift.st === 'confirmed');
    const myShift = dayShifts.find((shift) => shift.uid === currentUser?.id);
    const isToday = dateKey === todayIso;
    cells.push({ type: 'day', day, dateKey, dayShifts, myShift, isToday });
  }

  const usedCells = firstDay + daysInMonth;
  const extraCells = Math.ceil(usedCells / 7) * 7 - usedCells;
  for (let i = 1; i <= extraCells; i += 1) {
    cells.push({ type: 'next', dateNumber: i });
  }

  return { monthNames, dayNames, cells };
};

export const buildTaskList = (tasks: Task[], currentUser: User | null, isMgr: boolean, isStf: boolean, tFilter: TaskStatus | 'all' | 'progress') => {
  let list = isMgr || isStf ? tasks : tasks.filter((task) => task.to === currentUser?.id || !task.to);
  if (tFilter !== 'all' && tFilter !== 'progress') list = list.filter((task) => task.st === tFilter);
  return list;
};

export const buildGachaTask = (tasks: Task[], currentUser: User | null) => tasks.find((task) => task.to === currentUser?.id && (task.st === 'in_progress' || task.st === 'review'));

export const buildStaffStats = (users: User[]) => {
  const total = users.length;
  const partCount = users.filter((user) => user.role === 'part').length;
  const staffCount = users.filter((user) => user.role !== 'part').length;
  return { total, partCount, staffCount };
};
