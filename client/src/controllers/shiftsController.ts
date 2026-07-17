import type { Dispatch, SetStateAction } from 'react';
import type { ShiftPattern, Task, User } from '../models';
import { createConfirmedShift, createShiftBulk, createShiftRequest } from '../services/api';

type ShiftDeps = {
  currentUser: User | null;
  reqOff: boolean;
  cy: number;
  cm: number;
  shiftPatterns: ShiftPattern[];
  refreshShifts: () => Promise<void>;
  setModal: Dispatch<SetStateAction<string | null>>;
  handleNav: (page: 'dashboard' | 'shift' | 'shift-request' | 'shift-edit' | 'task' | 'gacha' | 'business-info' | 'staff' | 'notifications') => void;
  addNotification: (title: string, sub: string, uid: number, taskId?: number) => Promise<void>;
  toast: (message: string) => void;
};

export const createShiftHandlers = ({
  currentUser,
  reqOff,
  cy,
  cm,
  shiftPatterns,
  refreshShifts,
  setModal,
  handleNav,
  addNotification,
  toast,
}: ShiftDeps) => {
  const handleShiftRequestSubmit = async (
    currentUserParam: User | null,
    date: string,
    s: string,
    e: string,
    _setShiftsFn: (fn: any) => void,
    setModalFn: (m: any) => void,
    toastFn: (m: string) => void,
  ) => {
    if (!date || !s || !e) {
      toastFn('日付と時間を入力してください');
      return;
    }
    if (!currentUserParam) return;
    try {
      await createShiftRequest({
        uid: currentUserParam.id,
        date,
        s,
        e,
        st: 'request',
        isOff: reqOff,
      });
      await refreshShifts();
      setModalFn(null);
      toastFn('シフト希望を提出しました');
    } catch (err) {
      console.error(err);
      toastFn('通信エラーが発生しました');
    }
  };

  const handleBulkShiftRequestSubmit = async (entries: Array<{ date: string; patternId: number }>) => {
    if (!currentUser) return;
    const monthPrefix = `${cy}-${String(cm + 1).padStart(2, '0')}-`;
    const newEntries = entries
      .map((entry) => {
        const pattern = shiftPatterns.find((p) => p.id === entry.patternId);
        if (!pattern) return null;
        return { date: entry.date, s: pattern.workStart, e: pattern.workEnd, isOff: false };
      })
      .filter(Boolean);

    try {
      await createShiftBulk({
        uid: currentUser.id,
        monthPrefix,
        newEntries,
      });
      await refreshShifts();
      toast('シフト希望を提出しました');
      handleNav('shift');
    } catch (e) {
      console.error(e);
      toast('通信エラーが発生しました');
    }
  };

  const handleShiftCreateSubmit = async (
    csUidParam: number,
    csDateParam: string,
    csStartParam: string,
    csEndParam: string,
    _setShiftsFn: (fn: any) => void,
    setModalFn: (m: any) => void,
    toastFn: (m: string) => void,
  ) => {
    if (!csDateParam || !csStartParam || !csEndParam) {
      toastFn('入力を確認してください');
      return;
    }
    try {
      await createConfirmedShift({
        uid: csUidParam,
        date: csDateParam,
        s: csStartParam,
        e: csEndParam,
        st: 'confirmed',
        isOff: false,
      });
      await refreshShifts();
      setModalFn(null);
      toastFn('シフトを作成しました');
      await addNotification('シフトが確定しました', `${csDateParam} ${csStartParam}-${csEndParam} のシフトが確定されました`, csUidParam);
    } catch (e) {
      console.error(e);
      toastFn('通信エラーが発生しました');
    }
  };

  return {
    handleShiftRequestSubmit,
    handleBulkShiftRequestSubmit,
    handleShiftCreateSubmit,
  };
};
