import { useEffect, useMemo, useRef, useState } from 'react';
import { Role, Priority, TaskStatus, User, Shift, ShiftPattern, Task, GachaLog, Notification, BusinessInfo, USERS_INITIAL, SHIFTS_INITIAL, SHIFT_PATTERNS_INITIAL, TASKS_INITIAL, BUSINESS_INFO_INITIAL } from '../models';
import { signIn, fetchAuthSession, signOut } from 'aws-amplify/auth';

export default function useAppController() {
  const [loginUserId, setLoginUserId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftPatternsMap, setShiftPatternsMap] = useState<Record<number, ShiftPattern[]>>({});
  const shiftPatterns = currentUser
    ? (shiftPatternsMap[currentUser.id] ?? SHIFT_PATTERNS_INITIAL)
    : SHIFT_PATTERNS_INITIAL;

  // データ取得用の補助関数
  const refreshTasks = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/tasks');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setTasks(data);
      }
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
    }
  };

  const refreshUsers = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setUsers(data);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    }
  };

  const refreshShifts = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/shifts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setShifts(data);
      }
    } catch (e) {
      console.error('Failed to fetch shifts:', e);
    }
  };

  const refreshBusinessInfo = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/business-info');
      if (res.ok) {
        const data = await res.json();
        setBusinessInfo(data);
      }
    } catch (e) {
      console.error('Failed to fetch business info:', e);
    }
  };

  const refreshNotifications = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setNotifications(data);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  const refreshGachaHistory = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/gacha/history');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setGLog(data);
      }
    } catch (e) {
      console.error('Failed to fetch gacha history:', e);
    }
  };

  // 初回マウント時に全データを取得
  useEffect(() => {
    refreshTasks();
    refreshUsers();
    refreshShifts();
    refreshBusinessInfo();
    refreshNotifications();
    refreshGachaHistory();
  }, []);

  // ユーザーログイン時にそのユーザー固有のシフトパターンを取得
  useEffect(() => {
    if (!currentUser) return;
    const fetchShiftPatterns = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/shift-patterns?uid=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setShiftPatternsMap((prev) => ({ ...prev, [currentUser.id]: data }));
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
    const current = shiftPatternsMap[uid] ?? SHIFT_PATTERNS_INITIAL;
    const next = typeof action === 'function' ? action(current) : action;

    try {
      const res = await fetch('http://localhost:5001/api/shift-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, patterns: next }),
      });
      if (res.ok) {
        setShiftPatternsMap((prev) => ({ ...prev, [uid]: next }));
      } else {
        toast('パターン保存に失敗しました');
      }
    } catch (e) {
      console.error(e);
      toast('通信エラーが発生しました');
    }
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(BUSINESS_INFO_INITIAL);
  const [gLog, setGLog] = useState<GachaLog[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cy, setCy] = useState(2025);
  const [cm, setCm] = useState(5);
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
  const [csUid, setCsUid] = useState<number>(USERS_INITIAL[0]?.id ?? 1);
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
  const isMgr = currentUser?.role === 'manager';
  const isStf = currentUser && (currentUser.role === 'manager' || currentUser.role === 'staff');
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

  const unreadCount = notifications.filter((item: Notification) => !item.read && (currentUser?.role === 'manager' ? true : item.uid === currentUser?.id)).length;
  const toggleNotif = () => setNotificationOpen((prev: boolean) => !prev);

  const readNotif = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5001/api/notifications/${id}/read`, { method: 'PUT' });
      if (res.ok) {
        setNotifications((prev: Notification[]) => prev.map((item: Notification) => item.id === id ? { ...item, read: true } : item));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearNotifs = async () => {
    if (!currentUser) return;
    const toClear = notifications.filter((item) => !item.read && (currentUser.role === 'manager' || item.uid === currentUser.id));
    try {
      for (const item of toClear) {
        await fetch(`http://localhost:5001/api/notifications/${item.id}/read`, { method: 'PUT' });
      }
      setNotifications((prev: Notification[]) => prev.map((item: Notification) => currentUser.role === 'manager' || item.uid === currentUser.id ? { ...item, read: true } : item));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationAction = async (taskId: number, approved: boolean) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    // 通知をDBから削除
    const matchingNotifs = notifications.filter((item) => item.taskId === taskId && item.title === 'タスク完了報があります');
    try {
      for (const item of matchingNotifs) {
        await fetch(`http://localhost:5001/api/notifications/${item.id}`, { method: 'DELETE' });
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
      const res = await fetch('http://localhost:5001/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sub, uid, taskId }),
      });
      if (res.ok) {
        const newNotif = await res.json();
        setNotifications((prev: Notification[]) => [newNotif, ...prev]);
      }
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
        const confirmResult = await confirmSignIn({
          challengeResponse: password, // 今入力している「Pass-0001」で永続確定させる
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
        ) ?? null;

        if (!selectedUser) {
          toast('Cognito認証は成功しましたが、DBにアカウントが存在しません');
          return;
        }

        setCurrentUser(selectedUser);
        setActivePage('dashboard');
        toast(`${selectedUser.name}としてログインしました！`);
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
    if (page === 'task' && currentUser?.role === 'part') return;
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
    if (item.partOnly && currentUser?.role !== 'part') return false;
    if (item.id === 'task' && currentUser?.role === 'part') return false;
    return true;
  }), [currentUser, isMgr]);

  const todayIso = new Date().toISOString().slice(0, 10);

  const dashboardStats = (shiftsParam: Shift[], tasksParam: Task[], currentUserParam: User | null, isMgrParam: boolean) => {
    const todShifts = shiftsParam.filter((shift) => shift.date === todayIso && shift.st === 'confirmed');
    const myTasks = currentUserParam ? tasksParam.filter((task) => task.to === currentUserParam.id && task.st !== 'done') : [];

    return { todShifts, myTasks };
  };

  const renderTodayShifts = (shiftsParam: Shift[], usersParam: User[], currentUserParam: User | null) => {
    const todShifts = shiftsParam.filter((shift) => shift.date === todayIso && shift.st === 'confirmed');
    if (!todShifts.length) {
      return null;
    }

    return todShifts.map((shift) => {
      const user = usersParam.find((item) => item.id === shift.uid) ?? { name: '?', ini: '?' };
      const isMine = shift.uid === currentUserParam?.id;
      return { shift, user, isMine };
    });
  };

  const dashboardTasks = (tasksParam: Task[], currentUserParam: User | null, isMgrParam: boolean) => {
    if (!currentUserParam) return null;
    const showT = isMgrParam ? tasksParam.filter((task) => task.st !== 'done').slice(0, 5) : tasksParam.filter((task) => task.to === currentUserParam.id && task.st !== 'done').slice(0, 5);
    return showT;
  };

  const renderCalendar = (cyState: number, cmState: number, shiftsParam: Shift[], currentUserParam: User | null) => {
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
      const dayShifts = shiftsParam.filter((shift) => shift.date === dateKey && shift.st === 'confirmed');
      const myShift = dayShifts.find((shift) => shift.uid === currentUserParam?.id);
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

  const shiftTableRows = (shiftsParam: Shift[], usersParam: User[], currentUserParam: User | null, isMgrParam: boolean) => {
    const list = isMgrParam
      ? [...shiftsParam].sort((a, b) => a.date.localeCompare(b.date))
      : shiftsParam.filter((shift) => shift.uid === currentUserParam?.id).sort((a, b) => a.date.localeCompare(b.date));

    return list.map((shift) => {
      const user = usersParam.find((item) => item.id === shift.uid) ?? { name: '?' };
      const badge = shift.st === 'confirmed'
        ? { label: '確定', cls: 'b b-green' }
        : { label: '希望', cls: 'b b-orange' };
      return { shift, user, badge };
    });
  };

  const taskList = (tasksParam: Task[], currentUserParam: User | null, isMgrParam: boolean, isStfParam: boolean, tFilterParam: TaskStatus | 'all' | 'progress') => {
    let list = isMgrParam || isStfParam ? tasksParam : tasksParam.filter((task) => task.to === currentUserParam?.id || !task.to);
    if (tFilterParam !== 'all' && tFilterParam !== 'progress') list = list.filter((task) => task.st === tFilterParam);
    return list;
  };

  const gachaTask = (tasksParam: Task[], currentUserParam: User | null) => tasksParam.find((task) => task.to === currentUserParam?.id && (task.st === 'in_progress' || task.st === 'review'));

  const handleShiftRequestSubmit = async (currentUserParam: User | null, date: string, s: string, e: string, setShiftsFn: (fn: any) => void, setModalFn: (m: any) => void, toastFn: (m: string) => void) => {
    if (!date || !s || !e) { toastFn('日付と時間を入力してください'); return; }
    if (!currentUserParam) return;
    try {
      const res = await fetch('http://localhost:5001/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUserParam.id,
          date,
          s,
          e,
          st: 'request',
          isOff: reqOff,
        }),
      });
      if (res.ok) {
        await refreshShifts();
        setModalFn(null);
        toastFn('シフト希望を提出しました');
      } else {
        toastFn('提出に失敗しました');
      }
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
      const res = await fetch('http://localhost:5001/api/shifts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.id,
          monthPrefix,
          newEntries,
        }),
      });
      if (res.ok) {
        await refreshShifts();
        toast('シフト希望を提出しました');
        handleNav('shift');
      } else {
        toast('シフト提出に失敗しました');
      }
    } catch (e) {
      console.error(e);
      toast('通信エラーが発生しました');
    }
  };

  const handleShiftCreateSubmit = async (csUidParam: number, csDateParam: string, csStartParam: string, csEndParam: string, setShiftsFn: (fn: any) => void, setModalFn: (m: any) => void, toastFn: (m: string) => void) => {
    if (!csDateParam || !csStartParam || !csEndParam) { toastFn('入力を確認してください'); return; }
    try {
      const res = await fetch('http://localhost:5001/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: csUidParam,
          date: csDateParam,
          s: csStartParam,
          e: csEndParam,
          st: 'confirmed',
          isOff: false,
        }),
      });
      if (res.ok) {
        await refreshShifts();
        setModalFn(null);
        toastFn('シフトを作成しました');
        await addNotification('シフトが確定しました', `${csDateParam} ${csStartParam}-${csEndParam} のシフトが確定されました`, csUidParam);
      } else {
        toastFn('シフト作成に失敗しました');
      }
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
      const res = await fetch(`http://localhost:5001/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ st: 'in_progress', to: currentUser.id }),
      });
      if (res.ok) {
        await refreshTasks();
        toastFn('タスクを開始しました');
      } else {
        toastFn('タスクの開始に失敗しました');
      }
    } catch (e) {
      console.error(e);
      toastFn('通信エラーが発生しました');
    }
  };

  const handleRequestDone = async (id: number, setTasksFn: (fn: any) => void, toastFn: (m: string) => void) => {
    try {
      const res = await fetch(`http://localhost:5001/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ st: 'review' }),
      });
      if (res.ok) {
        await refreshTasks();
        toastFn('完了申請を送信しました');
        const task = tasks.find((item) => item.id === id);
        if (task) {
          await addNotification('タスク完了報があります', `「${task.name}」の完了報告が届いています`, 1, id);
        }
      } else {
        toastFn('完了申請に失敗しました');
      }
    } catch (e) {
      console.error(e);
      toastFn('通信エラーが発生しました');
    }
  };

  const handleTaskDelete = async (id: number) => {
    if (!window.confirm("本当に削除しますか？")) return;
    try {
      const res = await fetch(`http://localhost:5001/api/tasks/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast('削除しました');
        await refreshTasks();
      } else {
        toast('削除に失敗しました');
      }
    } catch (error) {
      console.error("削除エラー:", error);
      toast('通信エラーが発生しました');
    }
  };

  const handleTaskTogglePool = async (id: number, inPool: boolean) => {
    try {
      const res = await fetch(`http://localhost:5001/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inPool }),
      });
      if (res.ok) {
        await refreshTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTaskCreateSubmit = async (ctNameParam: string, ctDescParam: string, ctPriParam: Priority, ctXpParam: number, currentUserParam: User | null, setTasksFn: (fn: any) => void, setModalFn: (m: any) => void, toastFn: (m: string) => void) => {
    if (!ctNameParam.trim()) { toastFn('タスク名を入力してください'); return; }
    if (!currentUserParam) return;
    try {
      const res = await fetch('http://localhost:5001/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ctNameParam.trim(),
          desc: ctDescParam.trim(),
          pri: ctPriParam,
          xp: ctXpParam,
          st: 'pending',
          inPool: true,
        }),
      });
      if (res.ok) {
        await refreshTasks();
        setModalFn(null);
        toastFn('タスクを追加しました');
      }
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
        const res = await fetch('http://localhost:5001/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, inPool: true }) });
        if (!res.ok) throw new Error('タスク追加失敗');
        toast('タスクを追加しました');
      } else {
        const res = await fetch(`http://localhost:5001/api/tasks/${editingTaskId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('タスク更新失敗');
        toast('タスクを更新しました');
      }
      setModal(null);
      setEditingTaskId(null);
      const fetchRes = await fetch('http://localhost:5001/api/tasks');
      const tasksArray = await fetchRes.json();
      if (Array.isArray(tasksArray)) setTasks(tasksArray);
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
      const res = await fetch('http://localhost:5001/api/gacha/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableTasks: avail }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetch(`http://localhost:5001/api/tasks/${data.task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ st: 'in_progress', to: currentUserParam.id }),
        });
        await refreshTasks();
        await refreshGachaHistory();
        toastFn(`「${data.task.name}」が当たりました [${data.rarity}]`);
      } else {
        toastFn('ガチャに失敗しました');
      }
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
      const res = await fetch(`http://localhost:5001/api/tasks/${currentTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ st: 'review' }),
      });
      if (res.ok) {
        await refreshTasks();
        toastFn('完了申請を送信しました');
        await addNotification('タスク完了報があります', `「${currentTask.name}」の完了報告が届いています`, 1, currentTask.id);
      } else {
        toastFn('送信に失敗しました');
      }
    } catch (e) {
      console.error(e);
      toastFn('通信エラーが発生しました');
    }
  };

  const handleApproval = async (id: number, approved: boolean, setTasksFn: (fn: any) => void, tasksParam: Task[], setUsersFn: (fn: any) => void, toastFn: (m: string) => void, suppressNotification = false) => {
    const task = tasksParam.find((item) => item.id === id);
    if (!task) return;
    try {
      const res = await fetch(`http://localhost:5001/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ st: approved ? 'done' : 'in_progress' }),
      });
      if (res.ok) {
        if (approved && task.to) {
          const user = users.find((u) => u.id === task.to);
          if (user) {
            const newXp = user.xp + task.xp;
            await fetch(`http://localhost:5001/api/users/${task.to}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ xp: newXp }),
            });
            if (!suppressNotification) {
              await addNotification('タスクが承認されました', `「${task.name}」が承認され +${task.xp} XPが付与されました`, task.to);
            }
          }
        }
        await refreshTasks();
        await refreshUsers();
        toastFn(approved ? '承認しました' : '却下しました');
      } else {
        toastFn('操作に失敗しました');
      }
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
      const res = await fetch('http://localhost:5001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: asNameParam.trim(),
          role: asRoleParam,
          ...salaryFields,
        }),
      });
      if (res.ok) {
        await refreshUsers();
        setModalFn(null);
        toastFn('スタッフを追加しました');
      } else {
        toastFn('スタッフ追加に失敗しました');
      }
    } catch (e) {
      console.error(e);
      toastFn('通信エラーが発生しました');
    }
  };

  const handleSaveBusinessInfo = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/business-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessInfo),
      });
      if (res.ok) {
        toast('店舗設定を保存しました');
      } else {
        toast('保存に失敗しました');
      }
    } catch (e) {
      console.error(e);
      toast('通信エラーが発生しました');
    }
  };

  const staffStats = (usersParam: User[]) => {
    const total = usersParam.length;
    const partCount = usersParam.filter((user) => user.role === 'part').length;
    const staffCount = total - partCount;
    return { total, partCount, staffCount };
  };

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
    toast, handleLogin, logout, handleNav, isMgr, isStf,
    activeNavItems, todayIso, dashboardStats, renderTodayShifts, dashboardTasks,
    renderCalendar, shiftTableRows, taskList, gachaTask, handleShiftRequestSubmit, handleShiftCreateSubmit,
    handleTaskStart, handleRequestDone, handleTaskDelete, handleTaskTogglePool, handleTaskCreateSubmit,
    openTaskModal, handleTaskModalSubmit, editingTaskId,
    handleGacha, handleCompleteGachaTask, handleApproval, handleStaffCreate, staffStats,
    handleBulkShiftRequestSubmit, handleSaveBusinessInfo,
    password, setPassword,
  } as const;
}
