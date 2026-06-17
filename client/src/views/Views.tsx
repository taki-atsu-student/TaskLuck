import type { ReactNode } from 'react';
import ShiftRequestForm from '../components/ShiftRequestForm';
import type { ShiftRequestPayload } from '../types/shift';
import { Priority, TaskStatus, User, Shift, Task, GachaLog } from '../models';

type AuthViewProps = {
  selectedRole: 'staff' | 'part';
  onSelectRole: (role: 'staff' | 'part') => void;
  loginUserId: number | '';
  setLoginUserId: (value: number | '') => void;
  userOptions: User[];
  handleLogin: () => void;
};

export function AuthView({ selectedRole, onSelectRole, loginUserId, setLoginUserId, userOptions, handleLogin }: AuthViewProps) {
  return (
    <div id="login-screen">
      <div className="login-box">
        <div className="login-logo">
          <div className="login-logo-icon">T</div>
          <div className="login-logo-name">TaskLuck</div>
        </div>
        <h2>アカウントを選択してログイン</h2>
        <div className="role-tabs">
          <button type="button" className={`role-tab ${selectedRole === 'staff' ? 'active' : ''}`} onClick={() => { onSelectRole('staff'); setLoginUserId(''); }}>
            社員
          </button>
          <button type="button" className={`role-tab ${selectedRole === 'part' ? 'active' : ''}`} onClick={() => { onSelectRole('part'); setLoginUserId(''); }}>
            アルバイト
          </button>
        </div>
        <div className="fg">
          <label>アカウント</label>
          <select value={loginUserId} onChange={(event) => setLoginUserId(event.target.value ? Number(event.target.value) : '')}>
            <option value="">選択してください</option>
            {userOptions.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label>パスワード</label>
          <input type="password" value="demo" readOnly placeholder="demo" />
        </div>
        <button className="btn-login" type="button" onClick={handleLogin}>ログイン</button>
        <p className="hint">デモ用：パスワードは「demo」で固定</p>
      </div>
    </div>
  );
}

type DashboardViewProps = {
  isActive: boolean;
  isMgr: boolean;
  currentUser: User;
  dsObj: { todShifts: Shift[]; myTasks: Task[]; approvalCountParam: number };
  tasks: Task[];
  todayShifts: Array<{ shift: Shift; user: User | { name: string; ini: string }; isMine: boolean }> | null;
  dashTasks: Task[] | null;
  statusBadge: (s: TaskStatus) => ReactNode;
  priorityBadge: (p: Priority) => ReactNode;
};

export function DashboardView({ isActive, isMgr, currentUser, dsObj, tasks, todayShifts, dashTasks, statusBadge, priorityBadge }: DashboardViewProps) {
  return (
    <div className={`page ${isActive ? 'show' : ''}`} id="pg-dashboard">
      <div className="ph">
        <div><div className="pt">ダッシュボード</div><div className="ps" id="dd">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</div></div>
      </div>
      <div className="stats" id="ds">{
        isMgr ? (
          <>
            <div className="sc"><div className="sl">本日出勤</div><div className="sv">{dsObj.todShifts.length}</div></div>
            <div className="sc"><div className="sl">総タスク</div><div className="sv">{tasks.length}</div></div>
            <div className="sc"><div className="sl">承認待ち</div><div className="sv">{dsObj.approvalCountParam}</div></div>
            <div className="sc"><div className="sl">未割当</div><div className="sv">{tasks.filter((task) => !task.to).length}</div></div>
          </>
        ) : (
          <>
            <div className="sc"><div className="sl">レベル</div><div className="sv">Lv.{Math.floor((currentUser?.xp ?? 0) / 100) + 1}</div></div>
            <div className="sc"><div className="sl">合計 XP</div><div className="sv">{currentUser?.xp ?? 0}</div></div>
            <div className="sc"><div className="sl">進行中タスク</div><div className="sv">{dsObj.myTasks.length}</div></div>
            <div className="sc">
              <div className="sl">次LVまで</div>
              <div className="sv" style={{ fontSize: '16px' }}>{(currentUser?.xp ?? 0) % 100}<span style={{ fontSize: '11px', color: '#aaa' }}>/100</span></div>
              <div className="xp-wrap"><div className="xp-bar" style={{ width: `${(currentUser?.xp ?? 0) % 100}%` }} /></div>
            </div>
          </>
        )
      }</div>
      <div className="dash-grid">
        <div className="card"><div className="sec-lbl">今日のシフト</div><div id="dt-shifts">{
          !todayShifts || todayShifts.length === 0 ? (
            <div style={{ color: '#aaa', fontSize: '12px', padding: '8px 0' }}>本日のシフトはありません</div>
          ) : todayShifts.map(({ shift, user, isMine }) => (
            <div className="ti" key={shift.id}>
              <div className="sb-avatar" style={{ width: '26px', height: '26px', fontSize: '10px', flexShrink: 0 }}>{user.ini ?? '?'}</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: isMine ? 500 : 400 }}>
                  {user.name}{isMine ? ' ' : ''}{isMine ? <span className="b b-gray" style={{ fontSize: '10px' }}>自分</span> : null}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>{shift.s}–{shift.e}</div>
              </div>
            </div>
          ))
        }</div></div>
        <div className="card"><div className="sec-lbl">タスク状況</div><div id="dt-tasks">{
          !dashTasks || dashTasks.length === 0 ? (
            <div style={{ color: '#aaa', fontSize: '12px', padding: '8px 0' }}>タスクはありません</div>
          ) : dashTasks.map((task) => (
            <div className="ti" key={task.id}>
              <div className={`pdot ${task.pri === 'high' ? 'p-h' : task.pri === 'mid' ? 'p-m' : 'p-l'}`} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{task.name}</div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>{statusBadge(task.st)}<span style={{ fontSize: '11px', color: '#888' }}>+{task.xp} XP</span></div>
              </div>
            </div>
          ))
        }</div></div>
      </div>
    </div>
  );
}

type ShiftRow = { shift: Shift; user: User | { name: string; ini?: string }; badge: { label: string; cls: string } };

type ShiftViewProps = {
  isActive: boolean;
  isMgr: boolean;
  userId: number;
  onOpenShiftCreate: () => void;
  cal: { monthNames: string[]; dayNames: string[]; cells: any[] } | null;
  currentMonthLabel: string;
  setCm: (fn: (prev: number) => number) => void;
  shiftRows: ShiftRow[];
  users: User[];
  toast: (message: string) => void;
  setShifts: (fn: (prev: Shift[]) => Shift[]) => void;
  csUid: number;
  setCsUid: (value: number) => void;
  csDate: string;
  setCsDate: (value: string) => void;
  csStart: string;
  setCsStart: (value: string) => void;
  csEnd: string;
  setCsEnd: (value: string) => void;
  onShiftRequestSubmitPayload: (payload: ShiftRequestPayload) => Promise<void> | void;
  onShiftCreateSubmit: () => void;
};

export function ShiftView({ isActive, isMgr, userId, cal, currentMonthLabel, setCm, shiftRows, users, toast, setShifts, csUid, setCsUid, csDate, setCsDate, csStart, setCsStart, csEnd, setCsEnd, onShiftRequestSubmitPayload, onShiftCreateSubmit }: ShiftViewProps) {
  return (
    <div className={`page ${isActive ? 'show' : ''}`} id="pg-shift">
      <div className="ph">
        <div><div className="pt">シフト管理</div></div>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          {isMgr ? <button className="btn btn-dark" id="btn-cs" type="button" onClick={onShiftCreateSubmit}>{'+ シフト作成'}</button> : null}
        </div>
      </div>
      <div className="card" style={{ marginBottom: '16px' }}>
        <ShiftRequestForm userId={userId} onSubmit={onShiftRequestSubmitPayload} />
      </div>
      <div className="card" style={{ marginBottom: '12px' }}>
        {cal ? (
          <>
            <div className="cal-nav">
              <button className="btn btn-sm" type="button" onClick={() => setCm((prev) => prev - 1 < 0 ? 11 : prev - 1)}>‹‹</button>
              <span className="cal-month">{currentMonthLabel}</span>
              <button className="btn btn-sm" type="button" onClick={() => setCm((prev) => prev + 1 > 11 ? 0 : prev + 1)}>››</button>
            </div>
            <div className="cal-grid">
              {cal.dayNames.map((dn) => <div className="cal-dn" key={dn}>{dn}</div>)}
              {cal.cells.map((cell, idx) => {
                if (cell.type === 'prev' || cell.type === 'next') return <div className="cal-cell other" key={idx}><div className="cal-n">{cell.dateNumber}</div></div>;
                return (
                  <div className={`cal-cell${cell.isToday ? ' today' : ''}`} key={cell.dateKey}>
                    <div className="cal-n">{cell.day}</div>
                    {cell.myShift ? (
                      <div className="cal-ev cal-ev-me">{cell.myShift.s.slice(0, 5)}-{cell.myShift.e.slice(0, 5)}</div>
                    ) : cell.dayShifts.slice(0, 2).map((shift: Shift) => {
                      const u = users.find((it) => it.id === shift.uid) ?? { ini: '?' };
                      return <div className="cal-ev cal-ev-other" key={`s-${shift.id}`}>{u.ini} {shift.s.slice(0, 5)}</div>;
                    })}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
      <div className="card">
        <div className="sec-lbl">シフト一覧</div>
        <table className="tbl" id="stbl">
          <thead>
            <tr>
              <th>日付</th>
              <th>スタッフ</th>
              <th>時間</th>
              <th>状態</th>
              {isMgr ? <th>操作</th> : null}
            </tr>
          </thead>
          <tbody>
            {shiftRows.map(({ shift, user, badge }) => (
              <tr key={shift.id}>
                <td>{shift.date}</td>
                <td>{isMgr ? user.name : '自分'}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>{shift.s}–{shift.e}</td>
                <td><span className={badge.cls}>{badge.label}</span></td>
                {isMgr ? (
                  <td style={{ display: 'flex', gap: '5px', padding: '8px 12px' }}>
                    {shift.st === 'request' ? (
                      <button className="btn btn-sm" type="button" style={{ color: '#15803d', borderColor: '#bbf7d0' }} onClick={() => {
                        setShifts((prev) => prev.map((item) => item.id === shift.id ? { ...item, st: 'confirmed' } : item));
                        toast('シフトを承認しました');
                      }}>
                        承認
                      </button>
                    ) : null}
                    <button className="btn btn-sm btn-danger" type="button" onClick={() => {
                      setShifts((prev) => prev.filter((item) => item.id !== shift.id));
                      toast('削除しました');
                    }}>
                      削除
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type TaskViewProps = {
  isActive: boolean;
  isStf: boolean;
  tFilter: TaskStatus | 'all';
  setTFilter: (filter: TaskStatus | 'all') => void;
  tasksForView: Task[];
  users: User[];
  priorityBadge: (p: Priority) => ReactNode;
  statusBadge: (s: TaskStatus) => ReactNode;
  renderTaskActions: (task: Task) => ReactNode;
  onOpenTaskModal: () => void;
};

export function TaskView({ isActive, isStf, tFilter, setTFilter, tasksForView, users, priorityBadge, statusBadge, renderTaskActions, onOpenTaskModal }: TaskViewProps) {
  return (
    <div className={`page ${isActive ? 'show' : ''}`} id="pg-task">
      <div className="ph">
        <div><div className="pt">タスク管理</div></div>
        {isStf ? <button className="btn btn-dark" id="btn-ct" type="button" onClick={onOpenTaskModal}>+ タスク追加</button> : null}
      </div>
      <div className="card">
        <div className="tabs">
          {(['all','pending','in_progress','review','done'] as const).map((filter) => (
            <button key={filter} className={`tab ${tFilter === filter ? 'active' : ''}`} type="button" onClick={() => setTFilter(filter)}>
              {filter === 'all' ? 'すべて' : filter === 'pending' ? '未着手' : filter === 'in_progress' ? '進行中' : filter === 'review' ? '承認待ち' : '完了'}
            </button>
          ))}
        </div>
        <table className="tbl" id="ttbl">
          <thead>
            <tr>
              <th>タスク名</th>
              <th>優先度</th>
              <th>担当</th>
              <th>XP</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tasksForView.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#aaa', padding: '2rem', fontSize: '13px' }}>タスクはありません</td></tr>
            ) : tasksForView.map((task) => {
              const assignee = task.to ? users.find((user) => user.id === task.to) : null;
              return (
                <tr key={task.id}>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{task.name}</div>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>{task.desc}</div>
                  </td>
                  <td>{priorityBadge(task.pri)}</td>
                  <td>{assignee ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div className="sb-avatar" style={{ width: '22px', height: '22px', fontSize: '9px', flexShrink: 0 }}>{assignee.ini}</div>
                      <span>{assignee.name}</span>
                    </div>
                  ) : <span style={{ color: '#aaa' }}>未割当</span>}</td>
                  <td style={{ fontSize: '13px', color: '#555', fontWeight: 500 }}>+{task.xp}</td>
                  <td>{statusBadge(task.st)}</td>
                  <td>{renderTaskActions(task)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type GachaViewProps = {
  isActive: boolean;
  gachaLabel: string;
  gachaResult: Task | null;
  gLog: GachaLog[];
  handleGacha: () => void;
  gachaTaskVal: Task | undefined;
  gachaLock: boolean;
  priorityLabels: Record<Priority, string>;
};

export function GachaView({ isActive, gachaLabel, gachaResult, gLog, handleGacha, gachaTaskVal, gachaLock, priorityLabels }: GachaViewProps) {
  return (
    <div className={`page ${isActive ? 'show' : ''}`} id="pg-gacha">
      <div className="ph"><div><div className="pt">闇鍋ガチャ</div><div className="ps">ランダムにタスクが割り当てられます</div></div></div>
      <div className="card">
        <div className="gacha-wrap">
          <div className="drum"><div className="drum-txt" id="drum">{gachaLabel}</div></div>
          <button className="gacha-btn" id="gbtn" type="button" onClick={handleGacha} disabled={Boolean(gachaTaskVal) || gachaLock}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l4-4"/><path d="M16 4h4v4"/></svg>
            ガチャを引く
          </button>
          {gachaResult ? (
            <div className="gacha-res" id="gres" style={{ display: 'block' }}>
              <div className="gacha-res-lbl">割り当てられたタスク</div>
              <div className="gacha-res-name" id="gr-name">{gachaResult.name}</div>
              <div className="gacha-res-meta" id="gr-meta">優先度：{priorityLabels[gachaResult.pri]}　{gachaResult.desc}　報酬 +{gachaResult.xp} XP</div>
            </div>
          ) : null}
          <div className="gacha-hist" id="ghist">
            {gLog.length > 0 ? (
              <>
                <div className="sec-lbl" style={{ marginTop: '16px' }}>ガチャ履歴</div>
                {gLog.slice().reverse().map((entry, index) => (
                  <div className="ghe" key={`${entry.name}-${index}`}>
                    <span style={{ fontWeight: 500 }}>{entry.name}</span>
                    <span className="b b-gray">+{entry.xp} XP</span>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

type ApprovalViewProps = {
  isActive: boolean;
  approvalTasks: Task[];
  users: User[];
  priorityBadge: (p: Priority) => ReactNode;
  handleApproval: (id: number, approved: boolean) => void;
};

export function ApprovalView({ isActive, approvalTasks, users, priorityBadge, handleApproval }: ApprovalViewProps) {
  return (
    <div className={`page ${isActive ? 'show' : ''}`} id="pg-approval">
      <div className="ph"><div><div className="pt">完了承認</div><div className="ps">スタッフからの申請を確認して承認します</div></div></div>
      <div className="card">
        <table className="tbl" id="atbl">
          <thead>
            <tr>
              <th>タスク名</th>
              <th>担当</th>
              <th>優先度</th>
              <th>XP</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {approvalTasks.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: '2rem', fontSize: '13px' }}>承認待ちのタスクはありません</td></tr>
            ) : approvalTasks.map((task) => {
              const assignee = users.find((user) => user.id === task.to) ?? { name: '?', ini: '?' };
              return (
                <tr key={task.id}>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{task.name}</div>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>{task.desc}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div className="sb-avatar" style={{ width: '22px', height: '22px', fontSize: '9px' }}>{assignee.ini}</div>
                      {assignee.name}
                    </div>
                  </td>
                  <td>{priorityBadge(task.pri)}</td>
                  <td style={{ fontSize: '13px', fontWeight: 500, color: '#555' }}>+{task.xp}</td>
                  <td style={{ display: 'flex', gap: '5px', padding: '8px 12px' }}>
                    <button className="btn btn-sm" type="button" style={{ color: '#15803d', borderColor: '#bbf7d0' }} onClick={() => handleApproval(task.id, true)}>承認</button>
                    <button className="btn btn-sm btn-danger" type="button" onClick={() => handleApproval(task.id, false)}>却下</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type StaffViewProps = {
  isActive: boolean;
  users: User[];
  staffStats: { total: number; partCount: number; staffCount: number };
  onOpenStaffModal: () => void;
};

export function StaffView({ isActive, users, staffStats, onOpenStaffModal }: StaffViewProps) {
  return (
    <div className={`page ${isActive ? 'show' : ''}`} id="pg-staff">
      <div className="ph">
        <div><div className="pt">スタッフ管理</div></div>
        <button className="btn btn-dark" type="button" onClick={onOpenStaffModal}>+ スタッフ追加</button>
      </div>
      <div className="stats" id="ss">
        <div className="sc"><div className="sl">総スタッフ</div><div className="sv">{staffStats.total}</div></div>
        <div className="sc"><div className="sl">社員</div><div className="sv">{staffStats.staffCount}</div></div>
        <div className="sc"><div className="sl">アルバイト</div><div className="sv">{staffStats.partCount}</div></div>
      </div>
      <div className="card">
        <table className="tbl" id="sstbl">
          <thead>
            <tr>
              <th>名前</th>
              <th>役割</th>
              <th>XP</th>
              <th>レベル</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const lv = Math.floor(user.xp / 100) + 1;
              const xn = user.xp % 100;
              const roleBadge = user.role === 'manager' ? <span className="b b-gray">店長</span> : user.role === 'staff' ? <span className="b b-blue">社員</span> : <span className="b b-gray">アルバイト</span>;
              return (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="sb-avatar">{user.ini}</div>
                      <span style={{ fontWeight: 500 }}>{user.name}</span>
                    </div>
                  </td>
                  <td>{roleBadge}</td>
                  <td style={{ fontSize: '13px' }}>{user.xp} XP</td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>Lv.{lv}</div>
                    <div className="xp-wrap" style={{ width: '80px' }}><div className="xp-bar" style={{ width: `${xn}%` }} /></div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
