import type { Dispatch, SetStateAction } from 'react';
import type { BusinessInfo, GachaLog, Notification, Shift, ShiftPattern, Task, User } from '../models';
import { resolveUserRole } from '../models';
import { API_BASE_URL } from '../config/api';
import {
  fetchBusinessInfo,
  fetchGachaLog,
  fetchNotifications,
  fetchShifts,
  fetchTasks,
  fetchUsers,
  saveShiftPatterns,
} from '../services/api';

type DataDeps = {
  currentUser: User | null;
  shiftPatternsMap: Record<number, ShiftPattern[]>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setUsers: Dispatch<SetStateAction<User[]>>;
  setShifts: Dispatch<SetStateAction<Shift[]>>;
  setBusinessInfo: Dispatch<SetStateAction<BusinessInfo>>;
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
  setGLog: Dispatch<SetStateAction<GachaLog[]>>;
  setShiftPatternsMap: Dispatch<SetStateAction<Record<number, ShiftPattern[]>>>;
  toast: (message: string) => void;
};

export const createDataHandlers = ({
  currentUser,
  shiftPatternsMap,
  setTasks,
  setUsers,
  setShifts,
  setBusinessInfo,
  setNotifications,
  setGLog,
  setShiftPatternsMap,
  toast,
}: DataDeps) => {
  const refreshTasks = async () => {
    try {
      const data = await fetchTasks();
      if (Array.isArray(data)) setTasks(data);
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
    }
  };

  const refreshUsers = async () => {
    try {
      const data = await fetchUsers();
      if (Array.isArray(data)) setUsers(data.map((user) => ({ ...user, role: resolveUserRole(user) })));
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  const refreshShifts = async () => {
    try {
      const data = await fetchShifts();
      if (Array.isArray(data)) setShifts(data);
    } catch (e) {
      console.error('Failed to fetch shifts:', e);
    }
  };

  const refreshBusinessInfo = async () => {
    try {
      const data = await fetchBusinessInfo();
      setBusinessInfo(data);
    } catch (e) {
      console.error('Failed to fetch business info:', e);
    }
  };

  const refreshNotifications = async () => {
    try {
      const data = await fetchNotifications();
      if (Array.isArray(data)) setNotifications(data);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  const refreshGachaLog = async () => {
    try {
      const data = await fetchGachaLog();
      if (Array.isArray(data)) setGLog(data);
    } catch (e) {
      console.error('Failed to fetch gachalog:', e);
    }
  };

  const fetchShiftPatterns = async () => {
    if (!currentUser) return;

    try {
      const data = await fetch(`${API_BASE_URL}/api/shift-patterns?uid=${currentUser.id}`);
      if (data.ok) {
        const response = await data.json();
        if (Array.isArray(response)) {
          setShiftPatternsMap((prev) => ({ ...prev, [currentUser.id]: response }));
        }
      }
    } catch (e) {
      console.error('Failed to fetch shift patterns:', e);
    }
  };

  const setShiftPatterns = async (action: SetStateAction<ShiftPattern[]>) => {
    if (!currentUser) return;
    const uid = currentUser.id;
    const current = shiftPatternsMap[uid] ?? [];
    const next = typeof action === 'function' ? action(current) : action;

    try {
      await saveShiftPatterns(uid, next);
      setShiftPatternsMap((prev) => ({ ...prev, [uid]: next }));
    } catch (e) {
      console.error(e);
      toast('パターン保存に失敗しました');
    }
  };

  return {
    refreshTasks,
    refreshUsers,
    refreshShifts,
    refreshBusinessInfo,
    refreshNotifications,
    refreshGachaLog,
    fetchShiftPatterns,
    setShiftPatterns,
  };
};
