import { useEffect, useMemo, useRef, useState } from 'react';
import { Role, Priority, TaskStatus, User, Shift, ShiftPattern, Task, GachaLog, Notification, BusinessInfo, USERS_INITIAL, SHIFTS_INITIAL, SHIFT_PATTERNS_INITIAL, TASKS_INITIAL, BUSINESS_INFO_INITIAL } from '../models';

export default function useAppController() {
  const [loginUserId, setLoginUserId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(USERS_INITIAL);
  const [shifts, setShifts] = useState<Shift[]>(SHIFTS_INITIAL);
  const [shiftPatternsMap, setShiftPatternsMap] = useState<Record<number, ShiftPattern[]>>({});
  const shiftPatterns = currentUser
    ? (shiftPatternsMap[currentUser.id] ?? SHIFT_PATTERNS_INITIAL)
    : SHIFT_PATTERNS_INITIAL;
  const setShiftPatterns: React.Dispatch<React.SetStateAction<ShiftPattern[]>> = (action) => {
    if (!currentUser) return;
    const uid = currentUser.id;
    setShiftPatternsMap((prev) => {
      const current = prev[uid] ?? SHIFT_PATTERNS_INITIAL;
      const next = typeof action === 'function' ? action(current) : action;
      return { ...prev, [uid]: next };
    });
  };
  const [tasks, setTasks] = useState<Task[]>(TASKS_INITIAL);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(BUSINESS_INFO_INITIAL);
  const [gLog, setGLog] = useState<GachaLog[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cy, setCy] = useState(2025);
  const [cm, setCm] = useState(5);
  const [tFilter, setTFilter] = useState<TaskStatus | 'all' | 'progress'>('all');
  const [activePage, setActivePage] = useState<'dashboard' | 'shift' | 'shift-request' | 'task' | 'gacha' | 'business-info' | 'staff' | 'notifications'>('dashboard');
  const [modal, setModal] = useState<string | null>(null);
  const [toastText, setToastText] = useState('');
  const [gachaLock, setGachaLock] = useState(false);
  const [reqDate, setReqDate] = useState(new Date().toISOString().slice(0,10));
  const [reqStart, setReqStart] = useState('09:00');
  const [reqEnd, setReqEnd] = useState('17:00');
  const [reqOff, setReqOff] = useState(false);
  const [reqNote, setReqNote] = useState('');
  const [csUid, setCsUid] = useState<number>(USERS_INITIAL[0]?.id ?? 1);
  const [csDate, setCsDate] = useState(new Date().toISOString().slice(0,10));
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
  const readNotif = (id: number) => setNotifications((prev: Notification[]) => prev.map((item: Notification) => item.id === id ? { ...item, read: true } : item));
  const clearNotifs = () => {
    if (!currentUser) return;
    setNotifications((prev: Notification[]) => prev.map((item: Notification) => currentUser.role === 'manager' || item.uid === currentUser.id ? { ...item, read: true } : item));
  };
  
  // 💡 変更部分：[承認]や[却下]が押されたとき、バックエンドに結果を送り、DBから消滅（または復帰）させる
const handleNotificationAction = async (taskId: number, approved: boolean) => {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;
  if (!currentUser) return;

  try {
    // 1. バックエンドの「承認・拒否審査API」を叩く
    const res = await fetch(`http://localhost:5001/api/tasks/review/${taskId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: approved ? 'APPROVE' : 'REJECT',
        approvedByUserId: currentUser.id,
        comment: approved ? '' : 'もう一度作業内容を確認してください'
      })
    });

    if (!res.ok) throw new Error('審査処理に失敗しました');
    const data = await res.json();

    // 2. フロント側の表示も即座に同期させる
    if (approved) {
      // 💡 許可されたら：DB側で消滅するので、フロントのリスト（State）からも消し去る！
      setTasks((prev) => prev.filter((item) => item.id !== taskId));
      toast('タスクを承認しました。タスクは消滅しました！');
    } else {
      // 💡 却下されたら：ステータスを進行中（in_progress）に戻してバイトにやり直させる
      setTasks((prev) => prev.map((item) => item.id === taskId ? { ...item, st: 'in_progress' } : item));
      toast('タスクを却下（やり直し要請）しました');
    }

    // 処理が終わった完了報通知を、通知パネルの一覧から消す
    setNotifications((prev: Notification[]) => prev.filter((item: Notification) => item.taskId !== taskId));

  } catch (err) {
    console.error(err);
    toast('通信エラーが発生しました');
  }
};
  
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'manager') return;
    setNotifications((prev: Notification[]) => {
      const existingTaskIds = new Set(prev.filter((item) => item.taskId !== undefined).map((item) => item.taskId));
      const newNotifs = tasks
        .filter((task) => task.st === 'review' && !existingTaskIds.has(task.id))
        .map((task) => ({
          id: Date.now() + task.id,
          title: 'タスク完了報があります',
          sub: `「${task.name}」の完了報告が届いています`,
          read: false,
          uid: currentUser.id,
          taskId: task.id,
        }));
      if (newNotifs.length === 0) return prev;
      return [...newNotifs, ...prev];
    });
  }, [currentUser, tasks]);
  const updateBusinessInfo = (updater: (prev: BusinessInfo) => BusinessInfo) => setBusinessInfo(updater);
  const resetBusinessInfo = () => setBusinessInfo(BUSINESS_INFO_INITIAL);

  const addNotification = (title: string, sub: string, uid: number, taskId?: number) => {
    setNotifications((prev: Notification[]) => [{ id: Date.now(), title, sub, read: false, uid, taskId }, ...prev]);
  };

  const handleLogin = () => {
    const normalizedUserId = loginUserId
      .trim()
      .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));

    if (!normalizedUserId) {
      toast('アカウントを選択してください');
      return;
    }

    const parsedUserId = Number(normalizedUserId);
    if (Number.isNaN(parsedUserId)) {
      toast('ユーザーIDを正しい形式で入力してください');
      return;
    }

    const selectedUser = users.find((user) => user.id === parsedUserId) ?? null;
    if (!selectedUser) {
      toast('アカウントが見つかりません');
      return;
    }

    setCurrentUser(selectedUser);
    setActivePage('dashboard');
  };

  const logout = () => {
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
    const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const firstDay = new Date(cyState, cmState, 1).getDay();
    const daysInMonth = new Date(cyState, cmState + 1, 0).getDate();
    const prevMonthDays = new Date(cyState, cmState, 0).getDate();
    const dayNames = ['日','月','火','水','木','金','土'];
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

  const handleShiftRequestSubmit = (currentUserParam: User | null, date: string, s: string, e: string, setShiftsFn: (fn:any)=>void, setModalFn:(m:any)=>void, toastFn:(m:string)=>void) => {
    if (!date||!s||!e){toastFn('日付と時間を入力してください');return;}
    if (!currentUserParam) return;
    setShiftsFn((prev:any)=>[...prev.filter((sh:any)=>!(sh.uid===currentUserParam.id&&sh.date===date&&sh.st==='request')),{id:Date.now(),uid:currentUserParam.id,date,s,e,st:'request',isOff:reqOff}]);
    setModalFn(null);toastFn('シフト希望を提出しました');
  };

  const handleShiftCreateSubmit = (csUidParam:number, csDateParam:string, csStartParam:string, csEndParam:string, setShiftsFn:(fn:any)=>void, setModalFn:(m:any)=>void, toastFn:(m:string)=>void) => {
    if (!csDateParam||!csStartParam||!csEndParam){toastFn('入力を確認してください');return;}
    setShiftsFn((prev:any)=>[...prev,{id:Date.now(),uid:csUidParam,date:csDateParam,s:csStartParam,e:csEndParam,st:'confirmed'}]);
    setModalFn(null);toastFn('シフトを作成しました');
    addNotification('シフトが確定しました', `${csDateParam} ${csStartParam}-${csEndParam} のシフトが確定されました`, csUidParam);
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

  const handleTaskStart = (id:number, setTasksFn:(fn:any)=>void, toastFn:(m:string)=>void) => { setTasksFn((prev:any)=>prev.map((task:any)=>task.id===id?{...task,st:'in_progress'}:task)); toastFn('タスクを開始しました'); };
  const handleRequestDone = (id:number, setTasksFn:(fn:any)=>void, toastFn:(m:string)=>void) => { 
    setTasksFn((prev:any)=>prev.map((task:any)=>task.id===id?{...task,st:'review'}:task)); 
    toastFn('完了申請を送信しました');
    const task = tasks.find((item) => item.id === id);
    if (task) addNotification('タスク完了報があります', `「${task.name}」の完了報告が届いています`, 1, id);
  };
  
  const handleTaskDelete = (id:number, setTasksFn:(fn:any)=>void, toastFn:(m:string)=>void) => { setTasksFn((prev:any)=>prev.filter((task:any)=>task.id!==id)); toastFn('削除しました'); };
  const handleTaskTogglePool = (id:number, inPool:boolean, setTasksFn:(fn:any)=>void) => { setTasksFn((prev:any)=>prev.map((task:any)=>task.id===id?{...task,inPool}:task)); };
  const handleTaskCreateSubmit = (ctNameParam:string, ctDescParam:string, ctPriParam:Priority, ctXpParam:number, currentUserParam:User | null, setTasksFn:(fn:any)=>void, setModalFn:(m:any)=>void, toastFn:(m:string)=>void) => { if (!ctNameParam.trim()){ toastFn('タスク名を入力してください'); return; } if (!currentUserParam) return; setTasksFn((prev:any)=>[...prev,{id:Date.now(),name:ctNameParam.trim(),desc:ctDescParam.trim(),pri:ctPriParam,xp:ctXpParam,st:'pending',to:null,by:currentUserParam.id,inPool:true}]); setModalFn(null); toastFn('タスクを追加しました'); };

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

  const finalizeGachaDraw = (chosen: Task, currentUserParam: User, rkey: string, rarityLabel: string, setTasksFn:(fn:any)=>void, setGLogFn:(fn:any)=>void, toastFn:(m:string)=>void, setGachaLockFn:(b:boolean)=>void) => {
    setTasksFn((prev:any) => prev.map((task:any) => task.id === chosen.id ? { ...task, st: 'in_progress', to: currentUserParam.id } : task));
    setGLogFn((prev:any) => [...prev, { name: chosen.name, xp: chosen.xp, timestamp: Date.now(), rarity: rarityLabel, rkey, time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) }]);
    toastFn(`「${chosen.name}」が当たりました`);
    setGachaLockFn(false);
  };


  const handleGacha = (tasksParam:Task[], currentUserParam:User | null, setTasksFn:(fn:any)=>void, setGLogFn:(fn:any)=>void, toastFn:(m:string)=>void, setGachaLockFn:(b:boolean)=>void) => {
    const avail = tasksParam.filter((task)=>task.st==='pending'&& !task.to);
    if (!avail.length){ toastFn('引けるタスクがありません'); return; }
    if (!currentUserParam) return;
    setGachaLockFn(true);
    const rk = pickRarity();
    const rc = RARITY[rk];
    const chosen = avail[Math.floor(Math.random() * avail.length)];
    finalizeGachaDraw(chosen, currentUserParam, rk.toLowerCase(), rc.label, setTasksFn, setGLogFn, toastFn, setGachaLockFn);
  };

  // 💡 変更部分：完了ボタンを押したとき、バックエンドに通知を作成させ、stをreviewに変える
const handleCompleteGachaTask = async (setTasksFn: (fn: any) => void, toastFn: (m: string) => void, currentTask?: Task) => {
  if (!currentTask) {
    toastFn('完了するタスクがありません');
    return;
  }
  if (!currentUser) return;

  try {
    // 1. バックエンドのAPIに送信（タスク割当ID、またはタスクIDを渡す）
    const res = await fetch(`http://localhost:5001/api/tasks/submit/${currentTask.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        userName: currentUser.name
      })
    });

    if (!res.ok) throw new Error('完了報告の送信に失敗しました');
    const data = await res.json();

    // 2. 画面のタスク状態を「review（承認待ち）」に切り替える
    setTasksFn((prev: any) => prev.map((task: any) => task.id === currentTask.id ? { ...task, st: 'review' } : task));
    
    toastFn('タスクの完了申請を送信し、店長へ通知しました！');
  } catch (err) {
    console.error(err);
    toastFn('通信エラーが発生しました');
  }
};

  const handleApproval = (id:number, approved:boolean, setTasksFn:(fn:any)=>void, tasksParam:Task[], setUsersFn:(fn:any)=>void, toastFn:(m:string)=>void, suppressNotification = false) => {
    setTasksFn((prev:any)=>prev.map((task:any)=>task.id===id?{...task,st: approved? 'done':'in_progress'}:task));
    if (approved){
      const task = tasksParam.find((item)=>item.id===id);
      if (task?.to){ 
        setUsersFn((prev:any)=>prev.map((user:any)=>user.id===task.to?{...user,xp:user.xp+task.xp}:user)); 
        if (!suppressNotification) {
          addNotification('タスクが承認されました', `「${task.name}」が承認され +${task.xp} XPが付与されました`, task.to);
        }
      }
      toastFn('承認しました');
    } else { toastFn('却下しました'); }
  };

  const handleStaffCreate = (asNameParam:string, asRoleParam:Role, asSalaryParam:number, setUsersFn:(fn:any)=>void, setModalFn:(m:any)=>void, toastFn:(m:string)=>void) => {
    if (!asNameParam.trim()){ toastFn('名前を入力してください'); return; }
    setUsersFn((prev: User[]) => {
      const newId = prev.length > 0 ? Math.max(...prev.map((u) => u.id)) + 1 : 1;
      const password = `pass${String(newId).padStart(4, '0')}`;
      const salaryFields = asRoleParam === 'part'
        ? { hourlyWage: asSalaryParam }
        : { monthlySalary: asSalaryParam };
      return [...prev, { id: newId, name: asNameParam.trim(), role: asRoleParam, xp: 0, ini: asNameParam.trim().charAt(0) || 'S', password, ...salaryFields }];
    });
    setModalFn(null); toastFn('スタッフを追加しました');
  };

  const staffStats = (usersParam:User[]) => {
    const total = usersParam.length;
    const partCount = usersParam.filter((user)=>user.role==='part').length;
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
  } as const;
}
