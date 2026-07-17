import { useEffect, useMemo, useState } from 'react';
import { Role, Priority, TaskStatus, User, Shift, ShiftPattern, Task, GachaLog, Notification, BusinessInfo, BUSINESS_INFO_INITIAL, normalizeRole, resolveUserRole } from '../models';
import { updateBusinessInfo as saveBusinessInfo } from '../services/api';
import {
  buildCalendarModel,
  buildDashboardStats,
  buildDashboardTasks,
  buildGachaTask,
  buildStaffStats,
  buildTaskList,
  buildTodayShifts,
} from './appViewModel';
import { createAuthHandlers } from './authController';
import { createDataHandlers } from './dataController';
import { createTaskHandlers } from './tasksController';
import { createShiftHandlers } from './shiftsController';
import { createGachaHandlers } from './gachaController';
import { createStaffHandlers } from './staffController';
import { createNotificationHandlers } from './notificationsController';

export default function useAppController() {
  const [loginUserId, setLoginUserId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftPatternsMap, setShiftPatternsMap] = useState<Record<number, ShiftPattern[]>>({});
  const shiftPatterns = currentUser
    ? (shiftPatternsMap[currentUser.id] ?? [])
    : [];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(BUSINESS_INFO_INITIAL);
  const [gLog, setGLog] = useState<GachaLog[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cy, setCy] = useState(() => Math.max(1980, new Date().getFullYear()));
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
  useEffect(() => {
    // debug: ロールが正しく正規化されているか確認する
    // コンソールに出力してログイン時の挙動を追跡します
    // (リリース前に削除して構いません)
    // eslint-disable-next-line no-console
    console.debug('useAppController: currentUser.role=', currentUser?.role, 'normalizedRole=', normalizedRole, 'isMgr=', isMgr, 'isStf=', isStf);
  }, [currentUser, normalizedRole, isMgr, isStf]);
  const [password, setPassword] = useState<string>('');

  const dataHandlers = createDataHandlers({
    currentUser,
    shiftPatternsMap,
    setTasks,
    setUsers,
    setShifts,
    setBusinessInfo,
    setNotifications,
    setGLog,
    setShiftPatternsMap,
    toast: () => undefined,
  });

  const refreshTasks = dataHandlers.refreshTasks;
  const refreshUsers = dataHandlers.refreshUsers;
  const refreshShifts = dataHandlers.refreshShifts;
  const refreshBusinessInfo = dataHandlers.refreshBusinessInfo;
  const refreshNotifications = dataHandlers.refreshNotifications;
  const refreshGachaLog = dataHandlers.refreshGachaLog;
  const setShiftPatterns = dataHandlers.setShiftPatterns;

  useEffect(() => {
    void refreshTasks();
    void refreshUsers();
    void refreshShifts();
    void refreshBusinessInfo();
    void refreshNotifications();
    void refreshGachaLog();
  }, []);

  useEffect(() => {
    void dataHandlers.fetchShiftPatterns();
  }, [currentUser]);

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

  const authHandlers = createAuthHandlers({
    loginUserId,
    password,
    users,
    toast,
    setCurrentUser,
    setActivePage,
    setLoginUserId,
    setNotificationOpen,
    setGachaLock,
  });

  const handleLogin = authHandlers.handleLogin;
  const logout = authHandlers.logout;

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

  const updateBusinessInfo = (updater: (prev: BusinessInfo) => BusinessInfo) => setBusinessInfo(updater);
  const resetBusinessInfo = async () => {
    await refreshBusinessInfo();
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

  let handleApprovalFn: (id: number, approved: boolean, setTasksFn: (fn: any) => void, tasksParam: Task[], setUsersFn: (fn: any) => void, toastFn: (m: string) => void, suppressNotification?: boolean) => Promise<void> = async () => {};

  const notificationHandlers = createNotificationHandlers({
    currentUser,
    notifications,
    tasks,
    isLeadership,
    setNotifications,
    setNotificationOpen,
    handleApproval: handleApprovalFn,
    setTasks,
    setUsers,
    toast,
  });

  const taskHandlers = createTaskHandlers({
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
    addNotification: notificationHandlers.addNotification,
    toast,
  });
  handleApprovalFn = taskHandlers.handleApproval;

  const shiftHandlers = createShiftHandlers({
    currentUser,
    reqOff,
    cy,
    cm,
    shiftPatterns,
    refreshShifts,
    setModal,
    handleNav,
    addNotification: notificationHandlers.addNotification,
    toast,
  });

  const gachaHandlers = createGachaHandlers({
    currentUser,
    refreshTasks,
    refreshGachaLog,
    addNotification: notificationHandlers.addNotification,
    setGachaLock,
    setTasks,
    setGLog,
    toast,
  });

  const staffHandlers = createStaffHandlers({
    users,
    setUsers,
    setCurrentUser,
    currentUser,
    refreshUsers,
    toast,
  });

  const handleShiftRequestSubmit = shiftHandlers.handleShiftRequestSubmit;
  const handleBulkShiftRequestSubmit = shiftHandlers.handleBulkShiftRequestSubmit;
  const handleShiftCreateSubmit = shiftHandlers.handleShiftCreateSubmit;
  const handleTaskStart = taskHandlers.handleTaskStart;
  const handleRequestDone = taskHandlers.handleRequestDone;
  const handleTaskDelete = taskHandlers.handleTaskDelete;
  const handleTaskTogglePool = taskHandlers.handleTaskTogglePool;
  const handleTaskCreateSubmit = taskHandlers.handleTaskCreateSubmit;
  const openTaskModal = taskHandlers.openTaskModal;
  const handleTaskModalSubmit = taskHandlers.handleTaskModalSubmit;
  const handleGacha = gachaHandlers.handleGacha;
  const handleCompleteGachaTask = gachaHandlers.handleCompleteGachaTask;
  const handleApproval = taskHandlers.handleApproval;
  const handleStaffCreate = staffHandlers.handleStaffCreate;
  const handleStaffDelete = staffHandlers.handleStaffDelete;
  const unreadCount = notificationHandlers.unreadCount;
  const toggleNotif = notificationHandlers.toggleNotif;
  const readNotif = notificationHandlers.readNotif;
  const clearNotifs = notificationHandlers.clearNotifs;
  const handleNotificationAction = notificationHandlers.handleNotificationAction;

  return {
    loginUserId, setLoginUserId, currentUser, setCurrentUser,
    users, setUsers, shifts, setShifts, shiftPatterns, setShiftPatterns, tasks, setTasks, businessInfo, updateBusinessInfo, resetBusinessInfo, gLog, setGLog,
    cy, setCy, cm, setCm, tFilter, setTFilter, activePage, setActivePage, modal, setModal,
    toastText, gachaLock, setGachaLock,
    notificationOpen, setNotificationOpen, notifications, setNotifications, unreadCount: notificationHandlers.unreadCount, toggleNotif: notificationHandlers.toggleNotif, readNotif: notificationHandlers.readNotif, clearNotifs: notificationHandlers.clearNotifs, handleNotificationAction: notificationHandlers.handleNotificationAction,
    reqDate, setReqDate, reqStart, setReqStart, reqEnd, setReqEnd, reqOff, setReqOff, reqNote, setReqNote,
    csUid, setCsUid, csDate, setCsDate, csStart, setCsStart, csEnd, setCsEnd,
    ctName, setCtName, ctDesc, setCtDesc, ctPri, setCtPri, ctXp, setCtXp,
    asName, setAsName, asRole, setAsRole, asSalary, setAsSalary,
    toast, handleLogin, logout, handleNav, isMgr, isLeadership, isStf,
    activeNavItems, todayIso, dashboardStats, renderTodayShifts, dashboardTasks,
    renderCalendar, taskList, gachaTask, handleShiftRequestSubmit: shiftHandlers.handleShiftRequestSubmit, handleShiftCreateSubmit: shiftHandlers.handleShiftCreateSubmit,
    handleTaskStart: taskHandlers.handleTaskStart, handleRequestDone: taskHandlers.handleRequestDone, handleTaskDelete: taskHandlers.handleTaskDelete, handleTaskTogglePool: taskHandlers.handleTaskTogglePool, handleTaskCreateSubmit: taskHandlers.handleTaskCreateSubmit,
    openTaskModal: taskHandlers.openTaskModal, handleTaskModalSubmit: taskHandlers.handleTaskModalSubmit, editingTaskId,
    handleGacha: gachaHandlers.handleGacha, handleCompleteGachaTask: gachaHandlers.handleCompleteGachaTask, handleApproval: taskHandlers.handleApproval, handleStaffCreate: staffHandlers.handleStaffCreate, handleStaffDelete: staffHandlers.handleStaffDelete, staffStats,
    handleBulkShiftRequestSubmit: shiftHandlers.handleBulkShiftRequestSubmit, handleSaveBusinessInfo,
    password, setPassword,
  } as const;
}
