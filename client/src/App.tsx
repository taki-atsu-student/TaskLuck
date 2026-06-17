import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { Role, Priority, TaskStatus, User, Shift, Task } from './models';
import useAppController from './controllers/useAppController';
import { AuthView, DashboardView, ShiftView, TaskView, GachaView, ApprovalView, StaffView } from './views/Views';

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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  cal: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  check: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
  ),
  dice: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/></svg>
  ),
  shield: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  users: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
};

export default function App() {
  const controller = useAppController();
  const {
    selectedRole, setSelectedRole, loginUserId, setLoginUserId, currentUser, setCurrentUser,
    users, setUsers, shifts, setShifts, tasks, setTasks, gLog, setGLog,
    cy, setCy, cm, setCm, tFilter, setTFilter, activePage, setActivePage, modal, setModal,
    toastText, setToastText, gachaLabel, setGachaLabel, gachaResult, setGachaResult, gachaLock, setGachaLock,
    reqDate, setReqDate, reqStart, setReqStart, reqEnd, setReqEnd, reqNote, setReqNote,
    csUid, setCsUid, csDate, setCsDate, csStart, setCsStart, csEnd, setCsEnd,
    ctName, setCtName, ctDesc, setCtDesc, ctPri, setCtPri, ctXp, setCtXp,
    asName, setAsName, asRole, setAsRole, assignTaskId, setAssignTaskId, assignUid, setAssignUid,
    toast, handleLogin, logout, handleNav, userOptions, isMgr, isStf, approvalCount,
    availableUsers, activeNavItems, todayIso, dashboardStats, renderTodayShifts, dashboardTasks,
    renderCalendar, shiftTableRows, taskList, gachaTask, handleShiftRequestSubmit, handleShiftCreateSubmit,
    handleTaskStart, handleRequestDone, openAssignModal, handleAssignSubmit, handleTaskDelete, handleTaskCreateSubmit,
    handleGacha, handleApproval, handleStaffCreate, approvalTasks, staffStats,
    gachaInterval, gachaTimeout,
  } = controller;

  const dsObj = dashboardStats(shifts, tasks, currentUser, isMgr, approvalCount);
  const todayShifts = renderTodayShifts(shifts, users, currentUser);
  const dashTasks = dashboardTasks(tasks, currentUser, isMgr);
  const cal = renderCalendar(cy, cm, shifts, users, currentUser);
  const currentMonthLabel = cal?.monthNames[cm] ?? '';
  const shiftRows = shiftTableRows(shifts, users, isMgr, toast, setShifts);
  const tasksForView = taskList(tasks, currentUser, isMgr, isStf ?? false, tFilter);
  const gachaTaskVal = gachaTask(tasks, currentUser);
  const staffStatsObj = staffStats(users);

  const renderTaskActions = (task: Task) => {
    if (!currentUser) return null;
    if (isMgr) {
      return (
        <>
          {!task.to ? <button className="btn btn-sm" type="button" onClick={() => openAssignModal(task.id, users, setAssignTaskId, setAssignUid, setModal)}>割当</button> : null}
          <button className="btn btn-sm btn-danger" type="button" onClick={() => handleTaskDelete(task.id, setTasks, toast)}>削除</button>
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
          selectedRole={selectedRole}
          onSelectRole={(role) => { setSelectedRole(role); setLoginUserId(''); }}
          loginUserId={loginUserId}
          setLoginUserId={setLoginUserId}
          userOptions={userOptions}
          handleLogin={handleLogin}
        />
      ) : (
        <div id="app">
          <div className="layout">
            <div className="sidebar">
              <div className="sb-top">
                <div className="sb-logo">
                  <div className="sb-logo-icon">T</div>
                  <div className="sb-logo-name">TaskLuck</div>
                </div>
                <div className="sb-user">
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
                    onClick={() => handleNav(item.id as typeof activePage)}
                  >
                    {ICONS[item.ic]}<span>{item.lbl}</span>
                    {item.id === 'approval' && approvalCount > 0 ? <span className="ni-badge">{approvalCount}</span> : null}
                  </button>
                ))}
              </nav>
              <div className="sb-footer">
                <button className="btn-logout" type="button" onClick={logout}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
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
                todayShifts={todayShifts}
                dashTasks={dashTasks}
                statusBadge={statusBadge}
                priorityBadge={priorityBadge}
              />

              <ShiftView
                isActive={activePage === 'shift'}
                isMgr={isMgr}
                userId={currentUser?.id ?? 0}
                onOpenShiftCreate={() => { setModal('modal-cs'); setCsDate(todayIso); }}
                cal={cal}
                currentMonthLabel={currentMonthLabel}
                setCm={setCm}
                shiftRows={shiftRows}
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
                onShiftRequestSubmitPayload={(payload) => {
                  if (!currentUser) {
                    toast('ログインが必要です');
                    return;
                  }
                  handleShiftRequestSubmit(currentUser, payload.date, payload.startTime, payload.endTime, setShifts, setModal, toast);
                }}
                onShiftCreateSubmit={() => handleShiftCreateSubmit(csUid, csDate, csStart, csEnd, setShifts, setModal, toast)}
              />

              <TaskView
                isActive={activePage === 'task'}
                isStf={!!isStf}
                tFilter={tFilter}
                setTFilter={setTFilter}
                tasksForView={tasksForView}
                users={users}
                priorityBadge={priorityBadge}
                statusBadge={statusBadge}
                renderTaskActions={renderTaskActions}
                onOpenTaskModal={() => setModal('modal-ct')}
              />
              <GachaView
                isActive={activePage === 'gacha'}
                gachaLabel={gachaLabel}
                gachaResult={gachaResult}
                gLog={gLog}
                handleGacha={() => handleGacha(tasks, currentUser, setTasks, setGachaLabel, setGachaResult, setGLog, toast, setGachaLock, gachaInterval, gachaTimeout)}
                gachaTaskVal={gachaTaskVal}
                gachaLock={gachaLock}
                priorityLabels={PRIO_LABELS}
              />
              <ApprovalView
                isActive={activePage === 'approval'}
                approvalTasks={approvalTasks}
                users={users}
                priorityBadge={priorityBadge}
                handleApproval={(id, approved) => handleApproval(id, approved, setTasks, tasks, setUsers, toast)}
              />
              <StaffView
                isActive={activePage === 'staff'}
                users={users}
                staffStats={staffStatsObj}
                onOpenStaffModal={() => setModal('modal-as')}
              />
            </main>
          </div>
        </div>
      )}

      <div className={`overlay ${modal === 'modal-shift-req' ? 'open' : ''}`} id="modal-shift-req" onClick={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <div className="modal">
          <h3>シフト希望を提出</h3>
          <div className="mfg"><label>日付</label><input type="date" value={reqDate} onChange={(event) => setReqDate(event.target.value)} /></div>
          <div className="mfg"><label>開始時間</label><input type="time" value={reqStart} onChange={(event) => setReqStart(event.target.value)} /></div>
          <div className="mfg"><label>終了時間</label><input type="time" value={reqEnd} onChange={(event) => setReqEnd(event.target.value)} /></div>
          <div className="mfg"><label>備考</label><input type="text" value={reqNote} onChange={(event) => setReqNote(event.target.value)} placeholder="任意" /></div>
          <div className="mf">
            <button className="btn" type="button" onClick={() => setModal(null)}>キャンセル</button>
            <button className="btn btn-dark" type="button" onClick={() => handleShiftRequestSubmit(currentUser, reqDate, reqStart, reqEnd, setShifts, setModal, toast)}>提出</button>
          </div>
        </div>
      </div>

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
          <h3>タスクを追加</h3>
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
            <button className="btn btn-dark" type="button" onClick={() => handleTaskCreateSubmit(ctName, ctDesc, ctPri, ctXp, currentUser, setTasks, setModal, toast)}>追加</button>
          </div>
        </div>
      </div>

      <div className={`overlay ${modal === 'modal-as' ? 'open' : ''}`} id="modal-as" onClick={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <div className="modal">
          <h3>スタッフを追加</h3>
          <div className="mfg"><label>名前</label><input type="text" value={asName} onChange={(event) => setAsName(event.target.value)} placeholder="山田 太郎" /></div>
          <div className="mfg"><label>役割</label><select value={asRole} onChange={(event) => setAsRole(event.target.value as Role)}>
            <option value="part">アルバイト</option>
            <option value="staff">社員</option>
          </select></div>
          <div className="mf">
            <button className="btn" type="button" onClick={() => setModal(null)}>キャンセル</button>
            <button className="btn btn-dark" type="button" onClick={() => handleStaffCreate(asName, asRole, setUsers, setModal, toast)}>追加</button>
          </div>
        </div>
      </div>

      <div className={`overlay ${modal === 'modal-assign' ? 'open' : ''}`} id="modal-assign" onClick={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
        <div className="modal">
          <h3>担当者を割り当て</h3>
          <div className="mfg"><label>スタッフ</label><select value={assignUid} onChange={(event) => setAssignUid(Number(event.target.value))} id="asgn-u">
            {availableUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select></div>
          <input type="hidden" id="asgn-tid" value={assignTaskId ?? ''} />
          <div className="mf">
            <button className="btn" type="button" onClick={() => setModal(null)}>キャンセル</button>
            <button className="btn btn-dark" type="button" onClick={() => handleAssignSubmit(assignTaskId, assignUid, setTasks, setModal, users, toast)}>割り当て</button>
          </div>
        </div>
      </div>

      <div id="toast" className={toastText ? 'show' : ''}>{toastText}</div>
    </>
  );
}
