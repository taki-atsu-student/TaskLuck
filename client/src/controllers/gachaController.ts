import type { Dispatch, SetStateAction } from 'react';
import type { GachaLog, Task, User } from '../models';
import { pullGacha, updateTask } from '../services/api';

type GachaDeps = {
  currentUser: User | null;
  refreshTasks: () => Promise<void>;
  refreshGachaLog: () => Promise<void>;
  addNotification: (title: string, sub: string, uid: number, taskId?: number) => Promise<void>;
  setGachaLock: Dispatch<SetStateAction<boolean>>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setGLog: Dispatch<SetStateAction<GachaLog[]>>;
  toast: (message: string) => void;
};

export const createGachaHandlers = ({
  currentUser,
  refreshTasks,
  refreshGachaLog,
  addNotification,
  setGachaLock,
  setTasks,
  setGLog,
  toast,
}: GachaDeps) => {
  const finalizeGachaDraw = (chosen: Task, currentUserParam: User, _setTasksFn: (fn: any) => void, _setGLogFn: (fn: any) => void, toastFn: (m: string) => void, setGachaLockFn: (b: boolean) => void) => {
    setTasks((prev) => prev.map((task) => task.id === chosen.id ? { ...task, st: 'in_progress', to: currentUserParam.id } : task));
    setGLog((prev) => [...prev, { name: chosen.name, xp: chosen.xp, timestamp: Date.now(), time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) }]);
    toastFn(`「${chosen.name}」が当たりました`);
    setGachaLockFn(false);
  };

  const handleGacha = async (
    tasksParam: Task[],
    currentUserParam: User | null,
    _setTasksFn: (fn: any) => void,
    _setGLogFn: (fn: any) => void,
    toastFn: (m: string) => void,
    _setGachaLockFn: (b: boolean) => void,
  ) => {
    const avail = tasksParam.filter((task) => task.st === 'pending' && !task.to);
    if (!avail.length) {
      toastFn('引けるタスクがありません');
      return;
    }
    if (!currentUserParam) return;
    setGachaLock(true);
    try {
      const data = await pullGacha({
        userId: currentUserParam.id,
        availableTasks: avail,
      });
      await updateTask(data.task.id, { st: 'in_progress', to: currentUserParam.id });
      await refreshTasks();
      await refreshGachaLog();
      toastFn(`「${data.task.name}」が当たりました`);
    } catch (e: any) {
      console.error(e);
      const message = e?.message || '通信エラーが発生しました';
      toastFn(message);
    } finally {
      setGachaLock(false);
    }
  };

  const handleCompleteGachaTask = async (_setTasksFn: (fn: any) => void, toastFn: (m: string) => void, currentTask?: Task) => {
    if (!currentTask) {
      toastFn('完了するタスクがありません');
      return;
    }
    try {
      await updateTask(currentTask.id, { st: 'review' });
      await refreshTasks();
      toastFn('完了申請を送信しました');
      await addNotification('タスク完了報があります', `「${currentTask.name}」の完了報告が届いています`, 1, currentTask.id);
    } catch (e) {
      console.error(e);
      toastFn('通信エラーが発生しました');
    }
  };

  return {
    finalizeGachaDraw,
    handleGacha,
    handleCompleteGachaTask,
  };
};
