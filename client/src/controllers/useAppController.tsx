import { useEffect, useMemo, useState } from 'react';
import { Role, Priority, TaskStatus, User, Shift, ShiftPattern, Task, GachaLog, Notification, BusinessInfo, BUSINESS_INFO_INITIAL, normalizeRole, resolveUserRole } from '../models';
import { signIn, fetchAuthSession, signOut } from 'aws-amplify/auth';
import { API_BASE_URL } from '../config/api';
import {
  createConfirmedShift,
  createNotification,
  createShiftBulk,
  createShiftRequest,
  createTask,
  createUser,
  deleteNotification,
  deleteTask,
  fetchBusinessInfo,
  fetchGachaHistory,
  fetchNotifications,
  fetchShifts,
  fetchTasks,
  fetchUsers,
  markNotificationRead,
  pullGacha,
  saveShiftPatterns,
  updateBusinessInfo as saveBusinessInfo,
  updateTask,
  updateUser,
  updateUserPassword,
} from '../services/api';
import {
  buildCalendarModel,
  buildDashboardStats,
  buildDashboardTasks,
  buildGachaTask,
  buildStaffStats,
  buildTaskList,
  buildTodayShifts,
} from './appViewModel';

export default function useAppController() {
  const [loginUserId, setLoginUserId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftPatternsMap, setShiftPatternsMap] = useState<Record<number, ShiftPattern[]>>({});
  const shiftPatterns = currentUser
    ? (shiftPatternsMap[currentUser.id] ?? [])
    : [];

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

  const refreshGachaHistory = async () => {
    try {
      const data = await fetchGachaHistory();
      if (Array.isArray(data)) setGLog(data);
    } catch (e) {
      console.error('Failed to fetch gacha history:', e);
    }
  };

  useEffect(() => {
    refreshTasks();
    refreshUsers();
    refreshShifts();
    refreshBusinessInfo();
    refreshNotifications();
    refreshGachaHistory();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchShiftPatterns = async () => {
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
    fetchShiftPatterns();
  }, [currentUser]);

  const setShiftPatterns = async (action: React.SetStateAction<ShiftPattern[]>) => {
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

  const [tasks, setTasks] = useState<Task[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(BUSINESS_INFO_INITIAL);
  const [gLog, setGLog] = useState<GachaLog[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cy, setCy] = useState(() => new Date().getFullYear());
  const [cm, setCm] = useState(() => new Date().getMonth());
  const [tFilter, setTFilter] = useState<TaskStatus | 'all' | 'progress'>('all');
  const [activePage, setActivePage] = useState<'dashboard' | 'shift' | 'shift-request' | 'shift-edit' | 'task' | 'gacha' | 'business-info' | 'staff' | 'notifications'>('dashboard');
  const [modal, setModal] = useState<string | null>(null);
  const [toastText, setToastText] = useState('');
  const [gachaLock, setGachaLock] = useState(false);
  const [reqDate, setReqDate] = useState(new Date().toISOString().slice(0, 10));
  const [reqStart, setReqStart] = useState('09:00');
  const [reqEnd, setReqEnd] = useState('17:00');
  const [reqOff, setReqOff] = useState(false);
  const [reqNote, setReqNote] = useState('');
  const [csUid, setCsUid] = useState<number>(1);
  const [csDate, setCsDate] = useState(new Date().toISOString().slice(0, 10));
  const [csStart, setCsStart] = useState('09:00');
  const [csEnd, setCsEnd] = useState('17:00');
  const [ctName, setCtName] = useState('');
  const [ctDesc, setCtDesc] = useState('');
  const [ctPri, setCtPri] = useState<Priority>('mid');
  const [ctXp, setCtXp] = useState(50);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [asName, setAsName] = useState('');
  const [asRole, setAsRole] = useState<Role>('part');
  const [asSalary, setAsSalary] = useState<number>(1050);
  const normalizedRole = normalizeRole(currentUser?.role);
  const isMgr = normalizedRole === 'manager';
  const isLeadership = normalizedRole === 'manager';
  const isStf = currentUser && (normalizedRole === 'manager' || normalizedRole === 'staff');
  const [password, setPassword] = useState<string>('');

  useEffect(() => {
    if (!toastText) return;
    const timer = window.setTimeout(() => setToastText(''), 2600);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toastText]);

  useEffect(() => {
    return () => {
      setToastText('');
    };
  }, []);

  const toast = (message: string) => {
    setToastText(message);
  };

  const unreadCount = notifications.filter((item: Notification) => !item.read && (isLeadership ? true : item.uid === currentUser?.id)).length;
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

  const updateBusinessInfo = (updater: (prev: BusinessInfo) => BusinessInfo) => setBusinessInfo(updater);
  const resetBusinessInfo = async () => {
    await refreshBusinessInfo();
  };

  const addNotification = async (title: string, sub: string, uid: number, taskId?: number) => {
    try {
      const newNotif = await createNotification({ title, sub, uid, taskId });
      setNotifications((prev: Notification[]) => [newNotif, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async () => {
    const normalizedUsername = loginUserId.trim();

    if (!normalizedUsername || !password) {
      toast('ユーザー名とパスワードを入力してください');
      return;
    }

    try {
      // 1. まずサインインを試みる
      const { isSignedIn, nextStep } = await signIn({
        username: normalizedUsername,
        password: password,
      });

      let authenticated = isSignedIn;

      // 🔥【ここが裏ワザ】もし「パスワード強制変更」のロックがかかっていたら自動で解除する！
      if (nextStep && nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        const { confirmSignIn } = await import('aws-amplify/auth');
        // ⭕️ 必須属性の email も一緒に送信してロックを解除する形に修正
        const confirmResult = await confirmSignIn({
          challengeResponse: password,
          options: {
            userAttributes: {
              email: `${normalizedUsername}@example.com` // 💡 ユーザー名を使ったダミーメアドを自動設定
            }
          }
        });
        authenticated = confirmResult.isSignedIn;
      }

      if (authenticated) {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString() ?? null;
        if (token) {
          localStorage.setItem('token', token);
        }

        const selectedUser = users.find(
          (user) => String(user.username) === String(normalizedUsername)
        );
        const normalizedSelectedUser = selectedUser ? { ...selectedUser, role: resolveUserRole(selectedUser) } : null;

        if (!normalizedSelectedUser) {
          toast('Cognito認証は成功しましたが、DBにアカウントが存在しません');
          return;
        }

        setCurrentUser(normalizedSelectedUser);
        setActivePage('dashboard');
        toast(`${normalizedSelectedUser.name}としてログインしました！`);
      }
    } catch (error: any) {
      console.error('ログインエラー:', error);
      toast(`ログイン失敗: ${error.message || 'IDまたはパスワードが違います'}`);
    }
  };

  const logout = async () => {
    try {
      await signOut(); // Cognitoのセッションもクリア
    } catch (e) {
      console.error('Cognitoログアウトエラー:', e);
    }
    localStorage.removeItem('token');
    setCurrentUser(null);
    setActivePage('dashboard');
    setLoginUserId('');
    setNotificationOpen(false);
    setGachaLock(false);
  };

  const handleNav = (page: typeof activePage) => {
    if (page === 'task' && normalizedRole === 'part') return;
    setActivePage(page);
  };

  const availableUsers = useMemo(() => (
    users.filter((user) => user.role === 'part')
  ), [users]);

  const activeNavItems = useMemo(() => [
    { id: 'dashboard', lbl: 'ダッシュボード', ic: 'home' },
    { id: 'shift', lbl: 'シフト管理', ic: 'cal' },
    { id: 'task', lbl: 'タスク管理', ic: 'check' },
    { id: 'gacha', lbl: '闇鍋ガチャ', ic: 'dice', partOnly: true },
    { id: 'business-info', lbl: '店舗設定', ic: 'settings', mgrOnly: true },
    { id: 'staff', lbl: 'スタッフ管理', ic: 'users', mgrOnly: true },
    { id: 'notifications', lbl: '通知', ic: 'bell' },
  ].filter((item) => {
    if (item.mgrOnly && !isMgr) return false;
    if (item.partOnly && normalizedRole !== 'part') return false;
    if (item.id === 'task' && normalizedRole === 'part') return false;
    return true;
  }), [normalizedRole, isMgr]);

  const todayIso = new Date().toISOString().slice(0, 10);

  const dashboardStats = (shiftsParam: Shift[], tasksParam: Task[], currentUserParam: User | null, isMgrParam: boolean) => buildDashboardStats(shiftsParam, tasksParam, currentUserParam, todayIso);
  const renderTodayShifts = (shiftsParam: Shift[], usersParam: User[], currentUserParam: User | null) => buildTodayShifts(shiftsParam, usersParam, currentUserParam, todayIso);
  const dashboardTasks = (tasksParam: Task[], currentUserParam: User | null, isMgrParam: boolean) => buildDashboardTasks(tasksParam, currentUserParam, isMgrParam);
  const renderCalendar = (cyState: number, cmState: number, shiftsParam: Shift[], currentUserParam: User | null) => buildCalendarModel(cyState, cmState, shiftsParam, currentUserParam, todayIso);
  const taskList = (tasksParam: Task[], currentUserParam: User | null, isMgrParam: boolean, isStfParam: boolean, tFilterParam: TaskStatus | 'all' | 'progress') => buildTaskList(tasksParam, currentUserParam, isMgrParam, isStfParam, tFilterParam);
  const gachaTask = (tasksParam: Task[], currentUserParam: User | null) => buildGachaTask(tasksParam, currentUserParam);

  const handleShiftRequestSubmit = async (currentUserParam: User | null, date: string, s: string, e: string, setShiftsFn: (fn: any) => void, setModalFn: (m: any) => void, toastFn: (m: string) => void) => {
    if (!date || !s || !e) { toastFn('日付と時間を入力してください'); return; }
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

  const handleShiftCreateSubmit = async (csUidParam: number, csDateParam: string, csStartParam: string, csEndParam: string, setShiftsFn: (fn: any) => void, setModalFn: (m: any) => void, toastFn: (m: string) => void) => {
    if (!csDateParam || !csStartParam || !csEndParam) { toastFn('入力を確認してください'); return; }
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

  const RARITY: Record<string, { label: string; weight: number }> = {
    S: { label: 'SUPER', weight: 1 },
    A: { label: 'RARE', weight: 4 },
    B: { label: 'UNCOMMON', weight: 15 },
    C: { label: 'NORMAL', weight: 80 },
  };

  const pickRarity = () => {
    const total = Object.values(RARITY).reduce((s, r) => s + r.weight, 0);
    let v = Math.floor(Math.random() * total);
    for (const key of Object.keys(RARITY)) {
      const r = RARITY[key];
      if (v < r.weight) return key;
      v -= r.weight;
    }
    return 'C';
  };

  const handleTaskStart = async (id: number, setTasksFn: (fn: any) => void, toastFn: (m: string) => void) => {
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

  const handleRequestDone = async (id: number, setTasksFn: (fn: any) => void, toastFn: (m: string) => void) => {
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

  const handleTaskCreateSubmit = async (ctNameParam: string, ctDescParam: string, ctPriParam: Priority, ctXpParam: number, currentUserParam: User | null, setTasksFn: (fn: any) => void, setModalFn: (m: any) => void, toastFn: (m: string) => void) => {
    if (!ctNameParam.trim()) { toastFn('タスク名を入力してください'); return; }
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
    if (!ctName.trim()) { toast('タスク名を入力してください'); return; }
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

  const finalizeGachaDraw = (chosen: Task, currentUserParam: User, rkey: string, rarityLabel: string, setTasksFn: (fn: any) => void, setGLogFn: (fn: any) => void, toastFn: (m: string) => void, setGachaLockFn: (b: boolean) => void) => {
    setTasksFn((prev: any) => prev.map((task: any) => task.id === chosen.id ? { ...task, st: 'in_progress', to: currentUserParam.id } : task));
    setGLogFn((prev: any) => [...prev, { name: chosen.name, xp: chosen.xp, timestamp: Date.now(), rarity: rarityLabel, rkey, time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) }]);
    toastFn(`「${chosen.name}」が当たりました`);
    setGachaLockFn(false);
  };

  const handleGacha = async (tasksParam: Task[], currentUserParam: User | null, setTasksFn: (fn: any) => void, setGLogFn: (fn: any) => void, toastFn: (m: string) => void, setGachaLockFn: (b: boolean) => void) => {
    const avail = tasksParam.filter((task) => task.st === 'pending' && !task.to);
    if (!avail.length) { toastFn('引けるタスクがありません'); return; }
    if (!currentUserParam) return;
    setGachaLockFn(true);
    try {
      const data = await pullGacha({ userId: currentUserParam.id, availableTasks: avail });
      await updateTask(data.task.id, { st: 'in_progress', to: currentUserParam.id });
      await refreshTasks();
      await refreshGachaHistory();
      toastFn(`「${data.task.name}」が当たりました [${data.rarity}]`);
    } catch (e) {
      console.error(e);
      toastFn('通信エラーが発生しました');
    } finally {
      setGachaLockFn(false);
    }
  };

  const handleCompleteGachaTask = async (setTasksFn: (fn: any) => void, toastFn: (m: string) => void, currentTask?: Task) => {
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

  const handleApproval = async (id: number, approved: boolean, setTasksFn: (fn: any) => void, tasksParam: Task[], setUsersFn: (fn: any) => void, toastFn: (m: string) => void, suppressNotification = false) => {
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

  const handleStaffCreate = async (asNameParam: string, asRoleParam: Role, asSalaryParam: number, setUsersFn: (fn: any) => void, setModalFn: (m: any) => void, toastFn: (m: string) => void) => {
    if (!asNameParam.trim()) { toastFn('名前を入力してください'); return; }
    const salaryFields = asRoleParam === 'part'
      ? { hourlyWage: asSalaryParam }
      : { monthlySalary: asSalaryParam };

    try {
      await createUser({
        name: asNameParam.trim(),
        role: asRoleParam,
        ...salaryFields,
      });
      await refreshUsers();
      setModalFn(null);
      toastFn('スタッフを追加しました');
    } catch (e) {
      console.error(e);
      toastFn('通信エラーが発生しました');
    }
  };

  const handleSaveBusinessInfo = async () => {
    try {
      await saveBusinessInfo(businessInfo);
      toast('店舗設定を保存しました');
    } catch (e) {
      console.error(e);
      toast('通信エラーが発生しました');
    }
  };

  const staffStats = (usersParam: User[]) => buildStaffStats(usersParam.map((user) => ({ ...user, role: resolveUserRole(user) })));

  return {
    loginUserId, setLoginUserId, currentUser, setCurrentUser,
    users, setUsers, shifts, setShifts, shiftPatterns, setShiftPatterns, tasks, setTasks, businessInfo, updateBusinessInfo, resetBusinessInfo, gLog, setGLog,
    cy, setCy, cm, setCm, tFilter, setTFilter, activePage, setActivePage, modal, setModal,
    toastText, gachaLock, setGachaLock,
    notificationOpen, setNotificationOpen, notifications, setNotifications, unreadCount, toggleNotif, readNotif, clearNotifs, handleNotificationAction,
    reqDate, setReqDate, reqStart, setReqStart, reqEnd, setReqEnd, reqOff, setReqOff, reqNote, setReqNote,
    csUid, setCsUid, csDate, setCsDate, csStart, setCsStart, csEnd, setCsEnd,
    ctName, setCtName, ctDesc, setCtDesc, ctPri, setCtPri, ctXp, setCtXp,
    asName, setAsName, asRole, setAsRole, asSalary, setAsSalary,
    toast, handleLogin, logout, handleNav, isMgr, isLeadership, isStf,
    activeNavItems, todayIso, dashboardStats, renderTodayShifts, dashboardTasks,
    renderCalendar, taskList, gachaTask, handleShiftRequestSubmit, handleShiftCreateSubmit,
    handleTaskStart, handleRequestDone, handleTaskDelete, handleTaskTogglePool, handleTaskCreateSubmit,
    openTaskModal, handleTaskModalSubmit, editingTaskId,
    handleGacha, handleCompleteGachaTask, handleApproval, handleStaffCreate, staffStats,
    handleBulkShiftRequestSubmit, handleSaveBusinessInfo,
    password, setPassword,
  } as const;
}
