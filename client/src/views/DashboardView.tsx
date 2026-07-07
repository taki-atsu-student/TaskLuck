import { type ReactNode, useState } from 'react';
import { Priority, TaskStatus, User, Shift, Task, resolveUserRole } from '../models';

type DashboardViewProps = {
  isActive: boolean;
  isMgr: boolean;
  currentUser: User;
  dsObj: { todShifts: Shift[]; myTasks: Task[] };
  tasks: Task[];
  todayShifts: Array<{ shift: Shift; user: User | { name: string; ini: string }; isMine: boolean }> | null;
  dashTasks: Task[] | null;
  statusBadge: (s: TaskStatus) => ReactNode;
  priorityBadge: (p: Priority) => ReactNode;
  users: User[];
};

export function DashboardView({ isActive, isMgr, currentUser, dsObj, tasks, todayShifts, dashTasks, statusBadge, priorityBadge, users }: DashboardViewProps) {
  const [rankingTab, setRankingTab] = useState<'xp' | 'completed'>('xp');

  const getLevelProgress = (xp: number) => {
    let level = 1;
    let remainingXp = xp;
    let xpForNextLevel = 100;

    while (remainingXp >= xpForNextLevel) {
      remainingXp -= xpForNextLevel;
      level += 1;
      xpForNextLevel = Math.round(100 * Math.pow(1.1, level - 1));
    }

    return {
      level,
      xpIntoLevel: remainingXp,
      xpForNextLevel,
      progressPct: xpForNextLevel > 0 ? Math.round((remainingXp / xpForNextLevel) * 100) : 100,
    };
  };

  const getRankingData = (tab: 'xp' | 'completed') => {
    // アルバイト（part）ユーザーのみでランキングを作成
    const partUsers = users.filter((user) => resolveUserRole(user) === 'part');
    const ranking = partUsers.map((user) => {
      const completedTasks = tasks.filter((t) => t.to === user.id && t.st === 'done').length;
      return {
        ...user,
        completedCount: completedTasks,
      };
    });
    
    if (tab === 'xp') {
      return ranking.sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0)).slice(0, 5);
    } else {
      return ranking.sort((a, b) => (b.completedCount ?? 0) - (a.completedCount ?? 0)).slice(0, 5);
    }
  };

  const rankingData = getRankingData(rankingTab);
  const maxXp = rankingData.length > 0 ? Math.max(...rankingData.map((u) => u.xp ?? 0)) : 0;
  const maxCompleted = rankingData.length > 0 ? Math.max(...rankingData.map((u) => u.completedCount ?? 0)) : 0;
  const xpScaleMax = Math.max(maxXp, 1);
  const completedScaleMax = Math.max(maxCompleted, 1);

  const allCompletedTasks = tasks.filter((t) => t.st === 'done').length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((allCompletedTasks / tasks.length) * 100) : 100;
  const isStaff = currentUser?.role === 'staff';
  const isPart = currentUser?.role === 'part';

  const renderRoleStats = () => {
    if (isMgr) {
      return (
        <div className="stats" id="ds">
          <div className="sc">
            <div className="sl">全体タスク消化率</div>
            <div className="sv">{taskCompletionRate}%</div>
            <div className="xp-wrap"><div className="xp-bar" style={{ width: `${taskCompletionRate}%`, backgroundColor: '#3b82f6' }} /></div>
          </div>
        </div>
      );
    }

    if (isPart) {
      const levelProgress = getLevelProgress(currentUser?.xp ?? 0);

      return (
        <div className="stats" id="ds">
          <div className="sc"><div className="sl">レベル</div><div className="sv">Lv.{levelProgress.level}</div></div>
          <div className="sc"><div className="sl">合計 XP</div><div className="sv">{currentUser?.xp ?? 0}</div></div>
          <div className="sc">
            <div className="sl">次LVまで</div>
            <div className="sv" style={{ fontSize: '16px' }}>{levelProgress.xpIntoLevel}<span style={{ fontSize: '11px', color: '#aaa' }}>/{levelProgress.xpForNextLevel}</span></div>
            <div className="xp-wrap"><div className="xp-bar" style={{ width: `${Math.min(levelProgress.progressPct, 100)}%` }} /></div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`page ${isActive ? 'show' : ''}`} id="pg-dashboard">
      <div className="ph">
        <div><div className="pt">ダッシュボード</div><div className="ps" id="dd">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</div></div>
      </div>
      {!isMgr && (
        <div className="stats" id="ds-top" style={{ marginBottom: '12px' }}>
          <div className="sc">
            <div className="sl">全体タスク消化率</div>
            <div className="sv">{taskCompletionRate}%</div>
            <div className="xp-wrap"><div className="xp-bar" style={{ width: `${taskCompletionRate}%`, backgroundColor: '#3b82f6' }} /></div>
          </div>
        </div>
      )}
      {renderRoleStats()}
      {isMgr ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', alignItems: 'stretch' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}><div className="sec-lbl">今日のシフト</div><div id="dt-shifts" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>{
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
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
              <div className="sec-lbl" style={{ margin: 0 }}>ランキング</div>
              <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #f0f0f0' }}>
                <button 
                  type="button"
                  onClick={() => setRankingTab('xp')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: rankingTab === 'xp' ? '#1a1a1a' : 'transparent',
                    color: rankingTab === 'xp' ? '#fff' : '#888',
                    border: 'none',
                    borderRadius: '4px 4px 0 0',
                    fontFamily: 'inherit',
                    fontWeight: rankingTab === 'xp' ? 500 : 400,
                    transition: 'all 0.12s'
                  }}
                >
                  経験値
                </button>
                <button 
                  type="button"
                  onClick={() => setRankingTab('completed')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: rankingTab === 'completed' ? '#1a1a1a' : 'transparent',
                    color: rankingTab === 'completed' ? '#fff' : '#888',
                    border: 'none',
                    borderRadius: '4px 4px 0 0',
                    fontFamily: 'inherit',
                    fontWeight: rankingTab === 'completed' ? 500 : 400,
                    transition: 'all 0.12s'
                  }}
                >
                  完了数
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', flex: 1, overflow: 'auto', minHeight: 0 }}>
              {rankingData.length === 0 ? (
                <div style={{ color: '#aaa', fontSize: '12px', padding: '8px 0' }}>ユーザーがいません</div>
              ) : rankingData.map((user, index) => (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none' }}>
                  <div style={{ 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#f0f0f0',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: index < 3 ? '#fff' : '#999',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#1a1a1a', marginBottom: '4px' }}>{user.name}</div>
                    {rankingTab === 'xp' ? (
                      <>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                          <span>XP: <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{user.xp ?? 0}</span></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0, height: '4px', backgroundColor: '#f0f0f0', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ position: 'absolute', height: '100%', backgroundColor: '#bc29ea', width: `${Math.min(((user.xp ?? 0) / xpScaleMax) * 100, 100)}%`, left: 0, top: 0 }} />
                          </div>
                          <span style={{ width: '40px', textAlign: 'right', fontSize: '10px', color: '#999' }}>
                            {user.xp ?? 0}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                          <span>完了: <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{user.completedCount ?? 0}</span></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0, height: '4px', backgroundColor: '#f0f0f0', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ position: 'absolute', height: '100%', backgroundColor: '#3b82f6', width: `${Math.min(((user.completedCount ?? 0) / completedScaleMax) * 100, 100)}%`, left: 0, top: 0 }} />
                          </div>
                          <span style={{ width: '40px', textAlign: 'right', fontSize: '10px', color: '#999' }}>
                            {user.completedCount ?? 0}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'stretch' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}><div className="sec-lbl">今日のシフト</div><div id="dt-shifts" style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>{
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
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
              <div className="sec-lbl" style={{ margin: 0 }}>ランキング</div>
              <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #f0f0f0' }}>
                <button 
                  type="button"
                  onClick={() => setRankingTab('xp')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: rankingTab === 'xp' ? '#1a1a1a' : 'transparent',
                    color: rankingTab === 'xp' ? '#fff' : '#888',
                    border: 'none',
                    borderRadius: '4px 4px 0 0',
                    fontFamily: 'inherit',
                    fontWeight: rankingTab === 'xp' ? 500 : 400,
                    transition: 'all 0.12s'
                  }}
                >
                  経験値
                </button>
                <button 
                  type="button"
                  onClick={() => setRankingTab('completed')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    background: rankingTab === 'completed' ? '#1a1a1a' : 'transparent',
                    color: rankingTab === 'completed' ? '#fff' : '#888',
                    border: 'none',
                    borderRadius: '4px 4px 0 0',
                    fontFamily: 'inherit',
                    fontWeight: rankingTab === 'completed' ? 500 : 400,
                    transition: 'all 0.12s'
                  }}
                >
                  完了数
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', flex: 1, overflow: 'auto', minHeight: 0 }}>
              {rankingData.length === 0 ? (
                <div style={{ color: '#aaa', fontSize: '12px', padding: '8px 0' }}>ユーザーがいません</div>
              ) : rankingData.map((user, index) => (
                <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', borderBottom: index < 4 ? '1px solid #f0f0f0' : 'none' }}>
                  <div style={{ 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#f0f0f0',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: index < 3 ? '#fff' : '#999',
                    flexShrink: 0
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: '#1a1a1a', marginBottom: '4px' }}>{user.name}</div>
                    {rankingTab === 'xp' ? (
                      <>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                          <span>XP: <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{user.xp ?? 0}</span></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0, height: '4px', backgroundColor: '#f0f0f0', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ position: 'absolute', height: '100%', backgroundColor: '#bc29ea', width: `${Math.min(((user.xp ?? 0) / xpScaleMax) * 100, 100)}%`, left: 0, top: 0 }} />
                          </div>
                          <span style={{ width: '40px', textAlign: 'right', fontSize: '10px', color: '#999' }}>
                            {user.xp ?? 0}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                          <span>完了: <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{user.completedCount ?? 0}</span></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0, height: '4px', backgroundColor: '#f0f0f0', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ position: 'absolute', height: '100%', backgroundColor: '#3b82f6', width: `${Math.min(((user.completedCount ?? 0) / completedScaleMax) * 100, 100)}%`, left: 0, top: 0 }} />
                          </div>
                          <span style={{ width: '40px', textAlign: 'right', fontSize: '10px', color: '#999' }}>
                            {user.completedCount ?? 0}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
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
      )}
      {isMgr && (
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
      )}
    </div>
  );
}

