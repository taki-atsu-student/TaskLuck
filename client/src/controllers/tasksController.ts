import type { Dispatch, SetStateAction } from 'react';
import type { Priority, Task, User } from '../models';
import { createTask, deleteTask, updateTask, updateUser } from '../services/api';

type TaskDeps = {
  currentUser: User | null;
  tasks: Task[];
  users: User[];
  ctName: string;
  ctDesc: string;
  ctPri: Priority;
  ctXp: number;
  editingTaskId: number | null;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setUsers: Dispatch<SetStateAction<User[]>>;
  setModal: Dispatch<SetStateAction<string | null>>;
  setEditingTaskId: Dispatch<SetStateAction<number | null>>;
  setCtName: Dispatch<SetStateAction<string>>;
  setCtDesc: Dispatch<SetStateAction<string>>;
  setCtPri: Dispatch<SetStateAction<Priority>>;
  setCtXp: Dispatch<SetStateAction<number>>;
  refreshTasks: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  addNotification: (title: string, sub: string, uid: number, taskId?: number) => Promise<void>;
  toast: (message: string) => void;
};

export const createTaskHandlers = ({
  currentUser,
  tasks,
  users,
  ctName,
  ctDesc,
  ctPri,
  ctXp,
  editingTaskId,
  setTasks,
  setUsers,
  setModal,
  setEditingTaskId,
  setCtName,
  setCtDesc,
  setCtPri,
  setCtXp,
  refreshTasks,
  refreshUsers,
  addNotification,
  toast,
}: TaskDeps) => {
  const handleTaskStart = async (id: number, _setTasksFn: (fn: any) => void, toastFn: (m: string) => void) => {
    if (!currentUser) return;
    try {
      await updateTask(id, { st: 'in_progress', to: currentUser.id });
      await refreshTasks();
      toastFn('タスクを開始しました');
    } catch (e) {
      console.error(e);
      toastFn('通信エラーが発生しました');
    }
  };

  const handleRequestDone = async (id: number, _setTasksFn: (fn: any) => void, toastFn: (m: string) => void) => {
    try {
      await updateTask(id, { st: 'review' });
      await refreshTasks();
      toastFn('完了申請を送信しました');
      const task = tasks.find((item) => item.id === id);
      if (task) {
        await addNotification('タスク完了報があります', `「${task.name}」の完了報告が届いています`, 1, id);
      }
    } catch (e) {
      console.error(e);
      toastFn('通信エラーが発生しました');
    }
  };

  const handleTaskDelete = async (id: number) => {
    if (!window.confirm('本当に削除しますか？')) return;
    try {
      await deleteTask(id);
      toast('削除しました');
      await refreshTasks();
    } catch (error) {
      console.error('削除エラー:', error);
      toast('通信エラーが発生しました');
    }
  };

  const handleTaskTogglePool = async (id: number, inPool: boolean) => {
    try {
      await updateTask(id, { inPool });
      await refreshTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTaskCreateSubmit = async (
    ctNameParam: string,
    ctDescParam: string,
    ctPriParam: Priority,
    ctXpParam: number,
    currentUserParam: User | null,
    _setTasksFn: (fn: any) => void,
    setModalFn: (m: any) => void,
    toastFn: (m: string) => void,
  ) => {
    if (!ctNameParam.trim()) {
      toastFn('タスク名を入力してください');
      return;
    }
    if (!currentUserParam) return;
    try {
      await createTask({
        name: ctNameParam.trim(),
        desc: ctDescParam.trim(),
        pri: ctPriParam,
        xp: ctXpParam,
        st: 'pending',
        inPool: true,
      });
      await refreshTasks();
      setModalFn(null);
      toastFn('タスクを追加しました');
    } catch (e) {
      console.error(e);
    }
  };

  const openTaskModal = (task: Task | null) => {
    if (task) {
      setEditingTaskId(task.id);
      setCtName(task.name);
      setCtDesc(task.desc);
      setCtPri(task.pri);
      setCtXp(task.xp);
    } else {
      setEditingTaskId(null);
      setCtName('');
      setCtDesc('');
      setCtPri('mid');
      setCtXp(50);
    }
    setModal('modal-ct');
  };

  const handleTaskModalSubmit = async () => {
    if (!ctName.trim()) {
      toast('タスク名を入力してください');
      return;
    }

    const payload = { name: ctName.trim(), desc: ctDesc.trim(), pri: ctPri, xp: ctXp };

    try {
      if (editingTaskId === null) {
        await createTask({ ...payload, inPool: true });
        toast('タスクを追加しました');
      } else {
        await updateTask(editingTaskId, payload);
        toast('タスクを更新しました');
      }

      setModal(null);
      setEditingTaskId(null);
      await refreshTasks();
    } catch (err) {
      console.error(err);
      toast('タスク保存に失敗しました');
    }
  };

  const handleApproval = async (
    id: number,
    approved: boolean,
    _setTasksFn: (fn: any) => void,
    tasksParam: Task[],
    _setUsersFn: (fn: any) => void,
    toastFn: (m: string) => void,
    suppressNotification = false,
  ) => {
    const task = tasksParam.find((item) => item.id === id);
    if (!task) return;

    try {
      await updateTask(id, { st: approved ? 'done' : 'in_progress' });
      if (approved && task.to) {
        const user = users.find((u) => u.id === task.to);
        if (user) {
          const newXp = user.xp + task.xp;
          await updateUser(task.to, { xp: newXp });
          if (!suppressNotification) {
            await addNotification('タスクが承認されました', `「${task.name}」が承認され +${task.xp} XPが付与されました`, task.to);
          }
        }
      }
      await refreshTasks();
      await refreshUsers();
      toastFn(approved ? '承認しました' : '却下しました');
    } catch (e) {
      console.error(e);
      toastFn('通信エラーが発生しました');
    }
  };

  return {
    handleTaskStart,
    handleRequestDone,
    handleTaskDelete,
    handleTaskTogglePool,
    handleTaskCreateSubmit,
    openTaskModal,
    handleTaskModalSubmit,
    handleApproval,
  };
};
