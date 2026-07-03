import { useMemo, useEffect, useState } from 'react';
import './App.css';
import { Role, Priority, TaskStatus, User, Shift, ShiftPattern, Task, Notification } from './models';
import useAppController from './controllers/useAppController';
import { AuthView, DashboardView, ShiftView, TaskView, GachaView, BusinessInfoView, StaffView, NotificationPanel } from './views';
import { computeUnderstaffedDates } from './utils/shiftStaffing';
import ShiftRequestScreen from './views/ShiftRequestScreen';
import ShiftEditView from './views/ShiftEditView';

const ROLE_LABELS: Record<Role, string> = {
  manager: '店長',
  staff: '社員',
  part: 'アルバイト',
};

const PRIO_LABELS: Record<Priority, string> = {
  high: '高',
  mid: '中',
  low: '低',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '未着手',
  in_progress: '進行中',
  review: '承認待ち',
  done: '完了',
};

const ICONS: Record<string, React.JSX.Element> = {
  home: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
  ),
  cal: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  ),
  check: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
  ),
  dice: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="3" /><circle cx="8" cy="8" r="1.2" fill="currentColor" /><circle cx="16" cy="8" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="8" cy="16" r="1.2" fill="currentColor" /><circle cx="16" cy="16" r="1.2" fill="currentColor" /></svg>
  ),
  shield: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  ),
  settings: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.98 2.98l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m2.98-2.98l4.24-4.24M19.78 19.78l-4.24-4.24m-2.98-2.98l-4.24-4.24" /></svg>
  ),
  bell: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
  ),
  users: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
};

export default function App() {
  const controller = useAppController();
  const {
    loginUserId, setLoginUserId, currentUser, setCurrentUser,
    users, setUsers, shifts, setShifts, shiftPatterns, setShiftPatterns, tasks, setTasks, businessInfo, updateBusinessInfo, resetBusinessInfo, gLog, setGLog,
    cy, setCy, cm, setCm, tFilter, setTFilter, activePage, setActivePage, modal, setModal,
    toastText, gachaLock, setGachaLock,
    notificationOpen, notifications, unreadCount, toggleNotif, readNotif, clearNotifs, handleNotificationAction,
    reqDate, setReqDate, reqStart, setReqStart, reqEnd, setReqEnd, reqOff, setReqOff, reqNote, setReqNote,
    csUid, setCsUid, csDate, setCsDate, csStart, setCsStart, csEnd, setCsEnd,
    ctName, setCtName, ctDesc, setCtDesc, ctPri, setCtPri, ctXp, setCtXp,
    asName, setAsName, asRole, setAsRole, asSalary, setAsSalary,
    toast, handleLogin, logout, handleNav, isMgr, isStf,
    activeNavItems, todayIso, dashboardStats, renderTodayShifts, dashboardTasks,
    renderCalendar, taskList, gachaTask, handleShiftRequestSubmit, handleShiftCreateSubmit,
    handleTaskStart, handleRequestDone, handleTaskDelete, handleTaskCreateSubmit,
    openTaskModal, handleTaskModalSubmit, editingTaskId,
    handleGacha, handleCompleteGachaTask, handleApproval, handleStaffCreate, staffStats,
    handleTaskTogglePool, handleBulkShiftRequestSubmit, handleSaveBusinessInfo,
    password, setPassword,
  } = controller;




  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwValue, setPwValue] = useState('');
  const [pwVisible, setPwVisible] = useState(false);

  const handlePwSave = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`http://localhost:5001/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwValue }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === currentUser.id ? { ...u, password: pwValue } : u));
        setCurrentUser({ ...currentUser, password: pwValue });
        setPwOpen(false);
        toast('パスワードを変更しました');
      } else {
        toast('パスワード変更に失敗しました');
      }
    } catch {
      toast('通信エラーが発生しました');
    }
  };

  const openPwModal = () => {
    if (!currentUser) return;
    setPwValue(currentUser.password ?? '');
    setPwVisible(false);
    setPwOpen(true);
  };

  const dsObj = useMemo(() => dashboardStats(shifts, tasks, currentUser, isMgr), [shifts, tasks, currentUser, isMgr]);
  const todayShifts = useMemo(() => renderTodayShifts(shifts, users, currentUser), [shifts, users, currentUser]);
  const dashTasks = useMemo(() => dashboardTasks(tasks, currentUser, isMgr), [tasks, currentUser, isMgr]);
  const cal = useMemo(() => renderCalendar(cy, cm, shifts, currentUser), [cy, cm, shifts, currentUser]);
  const currentMonthLabel = useMemo(() => cal?.monthNames[cm] ?? '', [cal, cm]);
  const tasksForView = useMemo(() => taskList(tasks, currentUser, isMgr, isStf ?? false, tFilter), [tasks, currentUser, isMgr, isStf, tFilter]);
  const gachaTaskVal = useMemo(() => gachaTask(tasks, currentUser), [tasks, currentUser]);
  const pullTotal = useMemo(() => gLog.length, [gLog]);
  const pullLast = useMemo(() => gLog.length ? gLog[gLog.length - 1].rarity ?? gLog[gLog.length - 1].name : '—', [gLog]);
  const staffStatsObj = useMemo(() => staffStats(users), [users]);
  const understaffedDates = useMemo(() => computeUnderstaffedDates(shifts, businessInfo, todayIso), [shifts, businessInfo, todayIso]);

  const renderTaskActions = (task: Task) => {
    if (!currentUser) return null;
    if (isMgr) {
      return (
        <>
          {task.st === 'review' ? (
            <>
              <button className="btn btn-sm" type="button" style={{ color: '#15803d', borderColor: '#bbf7d0' }} onClick={() => handleApproval(task.id, true, setTasks, tasks, setUsers, toast)}>承認</button>
              <button className="btn btn-sm btn-danger" type="button" onClick={() => handleApproval(task.id, false, setTasks, tasks, setUsers, toast)}>却下</button>
            </>
          ) : null}
        </>
      );
    }
    if (task.to === currentUser.id) {
      if (task.st === 'pending') {
        return <button className="btn btn-sm btn-dark" type="button" onClick={() => handleTaskStart(task.id, setTasks, toast)}>開始</button>;
      }
      if (task.st === 'in_progress') {
        return <button className="btn btn-sm" type="button" style={{ color: '#15803d', borderColor: '#bbf7d0' }} onClick={() => handleRequestDone(task.id, setTasks, toast)}>完了申請</button>;
      }
      if (task.st === 'review') {
        return <span style={{ fontSize: '11px', color: '#aaa' }}>承認待ち</span>;
      }
    }
    return null;
  };

  const priorityBadge = (p: Priority) => (
    <span className={`b ${p === 'high' ? 'b-red' : p === 'mid' ? 'b-orange' : 'b-gray'}`}>{PRIO_LABELS[p]}</span>
  );

  const statusBadge = (s: TaskStatus) => (
    <span className={`b ${s === 'pending' ? 'b-gray' : s === 'in_progress' ? 'b-blue' : s === 'review' ? 'b-orange' : 'b-green'}`}>{STATUS_LABELS[s]}</span>
  );

  return (
    <>
      {!currentUser ? (
        <AuthView
          loginUserId={loginUserId}
          setLoginUserId={setLoginUserId}
          password={password}   // 💡 追加
          setPassword={setPassword} // 💡 追加
          handleLogin={handleLogin}
        />
      ) : (
        <div id="app">
          <div className="mobile-header">
            <button className="mobile-logo-btn" type="button" onClick={() => setMobileNavOpen(true)}>
              <img src="/favicon2.png" alt="TaskLuck" style={{ height: '36px', width: 'auto' }} />
              <span className="mobile-logo-name">TaskLuck</span>
            </button>
            <div className="sb-avatar">{currentUser.ini}</div>
          </div>

          <div className="layout">
            <div className={`sidebar${mobileNavOpen ? ' mobile-open' : ''}`}>
              <button className="sb-close" type="button" onClick={() => setMobileNavOpen(false)}>✕</button>
              <div className="sb-top">
                <div className="sb-logo">
                  <img src="/favicon.png" alt="TaskLuck" />
                </div>
                <div className="sb-user sb-user-clickable" onClick={openPwModal} title="パスワードを変更">
                  <div className="sb-avatar" id="sb-av">{currentUser.ini}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="sb-uname" id="sb-nm">{currentUser.name}</div>
                    <div className="sb-urole" id="sb-rl">{ROLE_LABELS[currentUser.role]}</div>
                  </div>
                </div>
              </div>
              <nav id="nav">
                {activeNavItems.map((item) => (
                  <button
                    key={item.id}
                    className={`ni ${activePage === item.id ? 'active' : ''}`}
                    type="button"
                    id={`ni-${item.id}`}
                    onClick={() => {
                      if (item.id === 'notifications') { toggleNotif(); } else { handleNav(item.id as typeof activePage); }
                      setMobileNavOpen(false);
                    }}
                  >
                    {ICONS[item.ic]}<span>{item.lbl}</span>
                    {item.id === 'notifications' && unreadCount > 0 ? <span className="ni-badge">{unreadCount}</span> : null}
                  </button>
                ))}
              </nav>
              <div className="sb-footer">
                <button className="btn-logout" type="button" onClick={() => { logout(); setMobileNavOpen(false); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                  ログアウト
                </button>
              </div>
            </div>

            <main>
              <DashboardView
                isActive={activePage === 'dashboard'}
                isMgr={isMgr}
                currentUser={currentUser}
                dsObj={dsObj}
                tasks={tasks}
                users={users}
                todayShifts={todayShifts}
                dashTasks={dashTasks}
                statusBadge={statusBadge}
                priorityBadge={priorityBadge}
              />

              <ShiftView
                isActive={activePage === 'shift'}
                isMgr={isMgr}
                isStf={!!isStf}
                onOpenShiftRequest={() => handleNav('shift-request')}
                onOpenShiftCreate={() => handleNav('shift-edit')}
                cal={cal}
                currentMonthLabel={currentMonthLabel}
                setCm={setCm}
                shifts={shifts}
                todayIso={todayIso}
                users={users}
                toast={toast}
                setShifts={setShifts}
                csUid={csUid}
                setCsUid={setCsUid}
                csDate={csDate}
                setCsDate={setCsDate}
                csStart={csStart}
                setCsStart={setCsStart}
                csEnd={csEnd}
                setCsEnd={setCsEnd}
                onShiftRequestSubmit={() => handleShiftRequestSubmit(currentUser, reqDate, reqStart, reqEnd, setShifts, setModal, toast)}
                onShiftCreateSubmit={() => handleShiftCreateSubmit(csUid, csDate, csStart, csEnd, setShifts, setModal, toast)}
                businessInfo={businessInfo}
                understaffedDates={understaffedDates}
              />

              <ShiftRequestScreen
                isActive={activePage === 'shift-request'}
                currentUser={currentUser}
                cal={cal}
                currentMonthLabel={currentMonthLabel}
                setCm={setCm}
                users={users}
                shiftPatterns={shiftPatterns}
                setShiftPatterns={setShiftPatterns}
                reqDate={reqDate}
                setReqDate={setReqDate}
                onSubmit={handleBulkShiftRequestSubmit}
                onCancel={() => handleNav('shift')}
                businessInfo={businessInfo}
              />

              <ShiftEditView
                isActive={activePage === 'shift-edit'}
                cal={cal}
                currentMonthLabel={currentMonthLabel}
                setCm={setCm}
                users={users}
                shifts={shifts}
                setShifts={setShifts}
                todayIso={todayIso}
                toast={toast}
                onBack={() => handleNav('shift')}
                understaffedDates={understaffedDates}
                businessInfo={businessInfo}
              />

              {currentUser?.role !== 'part' ? (
                <TaskView
                  isActive={activePage === 'task'}
                  isStf={!!isStf}
                  tFilter={tFilter}
                  setTFilter={setTFilter}
                  tasksForView={tasksForView}
                  allTasks={tasks}
                  users={users}
                  priorityBadge={priorityBadge}
                  statusBadge={statusBadge}
                  renderTaskActions={renderTaskActions}
                  toggleTaskPool={handleTaskTogglePool}
                  onOpenTaskModal={() => openTaskModal(null)}
                  onEditTask={(task) => openTaskModal(task)}
                  onDeleteTask={handleTaskDelete}
                />
              ) : null}
              {currentUser?.role === 'part' ? (
                <GachaView
                  isActive={activePage === 'gacha'}
                  gLog={gLog}
                  handleGacha={() => handleGacha(tasks, currentUser, setTasks, setGLog, toast, setGachaLock)}
                  handleCompleteGachaTask={() => handleCompleteGachaTask(setTasks, toast, gachaTaskVal)}
                  gachaTaskVal={gachaTaskVal}
                  gachaLock={gachaLock}
                />
              ) : null}
              {/* Approval view moved into the Dashboard */}
              <BusinessInfoView
                isActive={activePage === 'business-info'}
                businessInfo={businessInfo}
                updateBusinessInfo={updateBusinessInfo}
                resetBusinessInfo={resetBusinessInfo}
                toast={toast}
              />
              <StaffView
                isActive={activePage === 'staff'}
                users={users}
                setUsers={setUsers}
                staffStats={staffStatsObj}
                onOpenStaffModal={() => { setAsName(''); setAsRole('part'); setAsSalary(1050); setModal('modal-as'); }}
              />
            </main>
          </div>

          <div
            className={`sidebar-overlay${mobileNavOpen ? ' open' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          />
        </div>
      )}

      {currentUser ? (
        <NotificationPanel
          open={notificationOpen}
          notifications={currentUser.role === 'manager' ? notifications : notifications.filter((item: Notification) => item.uid === currentUser.id)}
          unreadCount={unreadCount}
          onClose={toggleNotif}
          onRead={readNotif}
          onClear={clearNotifs}
          isMgr={isMgr}
          onApprove={(taskId: number) => handleNotificationAction(taskId, true)}
          onReject={(taskId: number) => handleNotificationAction(taskId, false)}
        />
      ) : null}



      <div className={`overlay ${modal === 'modal-cs' ? 'open' : ''}`} id="modal-cs" onClick={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <div className="modal">
          <h3>シフトを作成</h3>
          <div className="mfg"><label>スタッフ</label><select value={csUid} onChange={(event) => setCsUid(Number(event.target.value))}>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select></div>
          <div className="mfg"><label>日付</label><input type="date" value={csDate} onChange={(event) => setCsDate(event.target.value)} /></div>
          <div className="mfg"><label>開始</label><input type="time" value={csStart} onChange={(event) => setCsStart(event.target.value)} /></div>
          <div className="mfg"><label>終了</label><input type="time" value={csEnd} onChange={(event) => setCsEnd(event.target.value)} /></div>
          <div className="mf">
            <button className="btn" type="button" onClick={() => setModal(null)}>キャンセル</button>
            <button className="btn btn-dark" type="button" onClick={() => handleShiftCreateSubmit(csUid, csDate, csStart, csEnd, setShifts, setModal, toast)}>作成</button>
          </div>
        </div>
      </div>

      <div className={`overlay ${modal === 'modal-ct' ? 'open' : ''}`} id="modal-ct" onClick={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <div className="modal">
          <h3>{editingTaskId === null ? 'タスクを追加' : 'タスクを編集'}</h3>
          <div className="mfg"><label>タスク名</label><input type="text" value={ctName} onChange={(event) => setCtName(event.target.value)} placeholder="例：冷蔵庫の整理" /></div>
          <div className="mfg"><label>詳細</label><input type="text" value={ctDesc} onChange={(event) => setCtDesc(event.target.value)} placeholder="任意" /></div>
          <div className="mfg"><label>優先度</label><select value={ctPri} onChange={(event) => setCtPri(event.target.value as Priority)}>
            <option value="high">高</option>
            <option value="mid">中</option>
            <option value="low">低</option>
          </select></div>
          <div className="mfg"><label>XP報酬</label><input type="number" value={ctXp} min={10} max={200} step={10} onChange={(event) => setCtXp(Number(event.target.value))} /></div>
          <div className="mf">
            <button className="btn" type="button" onClick={() => setModal(null)}>キャンセル</button>
            <button className="btn btn-dark" type="button" onClick={handleTaskModalSubmit}>
              {editingTaskId === null ? '追加' : '保存'}
            </button>
          </div>
        </div>
      </div>

      <div className={`overlay ${modal === 'modal-as' ? 'open' : ''}`} id="modal-as" onClick={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <div className="modal">
          <h3>スタッフを追加</h3>
          <div className="mfg"><label>名前</label><input type="text" value={asName} onChange={(event) => setAsName(event.target.value)} placeholder="山田 太郎" /></div>
          <div className="mfg"><label>役割</label><select value={asRole} onChange={(event) => { setAsRole(event.target.value as Role); setAsSalary(event.target.value === 'part' ? 1050 : 250010); }}>
            <option value="part">アルバイト</option>
            <option value="staff">社員</option>
          </select></div>
          <div className="mfg"><label>{asRole === 'part' ? '時給（円）' : '月給（円）'}</label><input type="number" value={asSalary} min={0} step={asRole === 'part' ? 50 : 10000} onChange={(event) => setAsSalary(Number(event.target.value))} /></div>
          <div className="mf">
            <button className="btn" type="button" onClick={() => setModal(null)}>キャンセル</button>
            <button className="btn btn-dark" type="button" onClick={() => handleStaffCreate(asName, asRole, asSalary, setUsers, setModal, toast)}>追加</button>
          </div>
        </div>
      </div>

      {pwOpen && currentUser && (() => {
        const lv = Math.floor(currentUser.xp / 100) + 1;
        const xpProg = currentUser.xp % 100;
        const salary = currentUser.role === 'part' ? currentUser.hourlyWage : currentUser.monthlySalary;
        const salaryLabel = currentUser.role === 'part' ? '時給' : '月給';
        const infoRow = (label: string, value: string) => (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#86868b' }}>{label}</span>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{value}</span>
          </div>
        );
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={(e) => { if (e.target === e.currentTarget) setPwOpen(false); }}
          >
            <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 32px', width: '400px', maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e8e8ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#444', flexShrink: 0 }}>
                  {currentUser.ini}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '17px', fontWeight: 700 }}>{currentUser.name}</div>
                  <div style={{ fontSize: '12px', color: '#86868b', marginTop: '4px' }}>{ROLE_LABELS[currentUser.role]}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
                {infoRow('ユーザーID', String(currentUser.id))}
                {infoRow('役割', ROLE_LABELS[currentUser.role])}
                <div>
                  <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '4px' }}>パスワード</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type={pwVisible ? 'text' : 'password'}
                      value={pwValue}
                      onChange={(e) => setPwValue(e.target.value)}
                      style={{ flex: 1, border: '1px solid #ddd', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                    <button type="button" onClick={() => setPwVisible((v) => !v)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#86868b', padding: '4px' }}>
                      {pwVisible ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                {salary !== undefined ? infoRow(`${salaryLabel}（円）`, salary.toLocaleString()) : null}
                {(currentUser.extraWages ?? []).filter((w) => w.title).map((w) => (
                  <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#86868b' }}>{w.title}（円）</span>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{w.amount.toLocaleString()}</span>
                  </div>
                ))}
                {infoRow('XP', `${currentUser.xp} XP`)}
                {infoRow('レベル', `Lv.${lv}`)}
                <div>
                  <div style={{ fontSize: '11px', color: '#86868b', marginBottom: '4px' }}>次のレベルまで</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: '#e8e8ed', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg,#34c759,#30d158)', width: `${xpProg}%`, transition: 'width .3s' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#555', minWidth: '50px' }}>{xpProg} / 100</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" type="button" onClick={() => setPwOpen(false)} style={{ flex: 1, textAlign: 'center' }}>キャンセル</button>
                <button className="btn btn-dark" type="button" onClick={handlePwSave} style={{ flex: 1, textAlign: 'center' }}>保存</button>
              </div>
            </div>
          </div>
        );
      })()}

      <div id="toast" className={toastText ? 'show' : ''}>{toastText}</div>
    </>
  );
}
