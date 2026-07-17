import type { Dispatch, SetStateAction } from 'react';
import type { Notification, Task, User } from '../models';
import { createNotification, deleteNotification, markNotificationRead } from '../services/api';

type NotificationDeps = {
  currentUser: User | null;
  notifications: Notification[];
  tasks: Task[];
  isLeadership: boolean;
  setNotifications: Dispatch<SetStateAction<Notification[]>>;
  setNotificationOpen: Dispatch<SetStateAction<boolean>>;
  handleApproval: (id: number, approved: boolean, setTasksFn: (fn: any) => void, tasksParam: Task[], setUsersFn: (fn: any) => void, toastFn: (m: string) => void, suppressNotification?: boolean) => Promise<void>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setUsers: Dispatch<SetStateAction<User[]>>;
  toast: (message: string) => void;
};

export const createNotificationHandlers = ({
  currentUser,
  notifications,
  tasks,
  isLeadership,
  setNotifications,
  setNotificationOpen,
  handleApproval,
  setTasks,
  setUsers,
  toast,
}: NotificationDeps) => {
  const unreadCount = notifications.filter((item) => !item.read && (isLeadership ? true : item.uid === currentUser?.id)).length;
  const toggleNotif = () => setNotificationOpen((prev: boolean) => !prev);

  const readNotif = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev: Notification[]) => prev.map((item: Notification) => item.id === id ? { ...item, read: true } : item));
    } catch (e) {
      console.error(e);
    }
  };

  const clearNotifs = async () => {
    if (!currentUser) return;
    const toClear = notifications.filter((item) => !item.read && (isLeadership || item.uid === currentUser.id));
    try {
      for (const item of toClear) {
        await markNotificationRead(item.id);
      }
      setNotifications((prev: Notification[]) => prev.map((item: Notification) => isLeadership || item.uid === currentUser.id ? { ...item, read: true } : item));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationAction = async (taskId: number, approved: boolean) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const matchingNotifs = notifications.filter((item) => item.taskId === taskId && item.title === 'タスク完了報があります');
    try {
      for (const item of matchingNotifs) {
        await deleteNotification(item.id);
      }
    } catch (e) {
      console.error(e);
    }

    setNotifications((prev: Notification[]) => prev.filter((item: Notification) => {
      if (item.taskId !== taskId) return true;
      if (item.title === 'タスク完了報があります') return false;
      return true;
    }));

    handleApproval(taskId, approved, setTasks, tasks, setUsers, toast, true);
  };

  const addNotification = async (title: string, sub: string, uid: number, taskId?: number) => {
    try {
      const newNotif = await createNotification({ title, sub, uid, taskId });
      setNotifications((prev: Notification[]) => [newNotif, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  return {
    unreadCount,
    toggleNotif,
    readNotif,
    clearNotifs,
    handleNotificationAction,
    addNotification,
  };
};
