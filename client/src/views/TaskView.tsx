import { type ReactNode, useMemo, useState } from 'react';
import { Priority, TaskStatus, Task, User } from '../models';

type TaskViewProps = {
  isActive: boolean;
  isStf: boolean;
  tFilter: TaskStatus | 'all' | 'progress';
  setTFilter: (filter: TaskStatus | 'all' | 'progress') => void;
  tasksForView: Task[];
  allTasks: Task[];
  users: User[];
  priorityBadge: (p: Priority) => ReactNode;
  statusBadge: (s: TaskStatus) => ReactNode;
  renderTaskActions: (task: Task) => ReactNode;
  toggleTaskPool: (id: number, inPool: boolean) => void;
  onOpenTaskModal: () => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: number) => void;
};

export function TaskView({ isActive, isStf, tFilter, setTFilter, tasksForView, allTasks, users, priorityBadge, statusBadge, renderTaskActions, toggleTaskPool, onOpenTaskModal, onEditTask, onDeleteTask }: TaskViewProps) {
  const [poolFilter, setPoolFilter] = useState<'all' | 'in' | 'out'>('all');
  const [selectedPrios, setSelectedPrios] = useState<Priority[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<number | 'all' | 'unassigned'>('all');
  const [xpMin, setXpMin] = useState<number | ''>('');
  const [xpMax, setXpMax] = useState<number | ''>('');
  const [sortKey, setSortKey] = useState<'name' | 'pri' | 'to' | 'xp' | 'st'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [dragTaskId, setDragTaskId] = useState<number | null>(null);

  const activeFilterCount = [
    poolFilter !== 'all',
    selectedPrios.length > 0,
    assigneeFilter !== 'all',
    xpMin !== '',
    xpMax !== '',
  ].filter(Boolean).length;

  const filteredTasks = useMemo(() => {
    let list = tasksForView.slice();
    if (poolFilter !== 'all') list = list.filter((t) => poolFilter === 'in' ? !!t.inPool : !t.inPool);
    if (selectedPrios.length) list = list.filter((t) => selectedPrios.includes(t.pri));
    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') {
        list = list.filter((t) => !t.to);
      } else {
        list = list.filter((t) => t.to === assigneeFilter);
      }
    }
    if (xpMin !== '') list = list.filter((t) => t.xp >= Number(xpMin));
    if (xpMax !== '') list = list.filter((t) => t.xp <= Number(xpMax));

    list.sort((a, b) => {
      let res = 0;
      if (sortKey === 'name') res = a.name.localeCompare(b.name);
      if (sortKey === 'pri') res = a.pri.localeCompare(b.pri);
      if (sortKey === 'to') res = (a.to ?? 0) - (b.to ?? 0);
      if (sortKey === 'xp') res = a.xp - b.xp;
      if (sortKey === 'st') res = a.st.localeCompare(b.st);
      return sortOrder === 'asc' ? res : -res;
    });

    return list;
  }, [tasksForView, poolFilter, selectedPrios, assigneeFilter, xpMin, xpMax, sortKey, sortOrder]);

  const poolTasks = filteredTasks.filter((task) => task.inPool);
  const nonPoolTasks = filteredTasks.filter((task) => !task.inPool);

  const handleDragStart = (taskId: number) => {
    setDragTaskId(taskId);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, inPool: boolean) => {
    event.preventDefault();
    if (dragTaskId !== null) {
      toggleTaskPool(dragTaskId, inPool);
    }
    setDragTaskId(null);
  };

  const renderTaskRow = (task: Task) => {
    const assignee = task.to ? users.find((user) => user.id === task.to) : null;
    return (
      <div
        key={task.id}
        className={`task-board-row${dragTaskId === task.id ? ' dragging' : ''}`}
        draggable
        onDragStart={() => handleDragStart(task.id)}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={task.inPool}
            onChange={(e) => {
              e.stopPropagation();
              toggleTaskPool(task.id, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 500 }}>{task.name}</div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{task.desc}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '12px', color: '#666' }}>
              <span>{assignee ? assignee.name : '未割当'}</span>
              <span>+{task.xp}XP</span>
            </div>
          </div>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {priorityBadge(task.pri)}
          {renderTaskActions(task)}
        </div>
      </div>
    );
  };

  return (
    <div className={`page ${isActive ? 'show' : ''}`} id="pg-task">
      <div className="ph">
        <div><div className="pt">タスク管理</div></div>
        {isStf ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn btn-dark" type="button" onClick={() => setShowManageModal(true)}>タスク編集</button>
            <button className="btn btn-dark" id="btn-ct" type="button" onClick={onOpenTaskModal}>+ タスク追加</button>
          </div>
        ) : null}
      </div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div className="tabs">
            {(['all','progress','done'] as const).map((filter) => (
              <button key={filter} className={`tab ${tFilter === filter ? 'active' : ''}`} type="button" onClick={() => setTFilter(filter)}>
                {filter === 'all' ? 'すべて' : filter === 'progress' ? '進行状況' : '完了'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>{allTasks.filter((t) => t.inPool).length}/{allTasks.length} プール</div>
            <button className="btn btn-sm" type="button" onClick={() => setShowFilterPopup(true)}>
              絞り込み条件{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </button>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
              <option value="name">名前で並び替え</option>
              <option value="pri">優先度</option>
              <option value="to">担当</option>
              <option value="xp">XP</option>
              <option value="st">状態</option>
            </select>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
              <option value="asc">昇順</option>
              <option value="desc">降順</option>
            </select>
          </div>
        </div>

        {showFilterPopup ? (
          <div className="overlay open" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }} onClick={(event) => { if (event.target === event.currentTarget) setShowFilterPopup(false); }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: 'min(720px,100%)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 15px 45px rgba(0,0,0,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>絞り込み条件</h3>
                <button className="btn btn-sm" type="button" onClick={() => setShowFilterPopup(false)}>閉じる</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '14px', backgroundColor: '#fafafa' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '10px', color: '#555' }}>プール</div>
                  <select value={poolFilter} onChange={(e) => setPoolFilter(e.target.value as any)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e5e5', fontSize: '13px' }}>
                    <option value="all">全て</option>
                    <option value="in">プール内</option>
                    <option value="out">プール外</option>
                  </select>
                </div>
                <div style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '14px', backgroundColor: '#fafafa' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '10px', color: '#555' }}>担当</div>
                  <select value={assigneeFilter} onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'all' || value === 'unassigned') {
                      setAssigneeFilter(value as 'all' | 'unassigned');
                    } else {
                      setAssigneeFilter(Number(value));
                    }
                  }} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e5e5', fontSize: '13px' }}>
                    <option value="all">全て</option>
                    <option value="unassigned">未割当</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '14px', backgroundColor: '#fafafa' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '10px', color: '#555' }}>優先度</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}><input type="checkbox" checked={selectedPrios.includes('high')} onChange={(e) => setSelectedPrios((prev) => e.target.checked ? [...prev, 'high'] : prev.filter((p) => p !== 'high'))} /> 高</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}><input type="checkbox" checked={selectedPrios.includes('mid')} onChange={(e) => setSelectedPrios((prev) => e.target.checked ? [...prev, 'mid'] : prev.filter((p) => p !== 'mid'))} /> 中</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}><input type="checkbox" checked={selectedPrios.includes('low')} onChange={(e) => setSelectedPrios((prev) => e.target.checked ? [...prev, 'low'] : prev.filter((p) => p !== 'low'))} /> 低</label>
                  </div>
                </div>
                <div style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '14px', backgroundColor: '#fafafa' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '10px', color: '#555' }}>XP</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" value={xpMin} min={0} onChange={(e) => setXpMin(e.target.value === '' ? '' : Number(e.target.value))} placeholder="例: 0" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e5e5', fontSize: '13px' }} />
                    <input type="number" value={xpMax} min={0} onChange={(e) => setXpMax(e.target.value === '' ? '' : Number(e.target.value))} placeholder="例: 100" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e5e5', fontSize: '13px' }} />
                  </div>
                </div>
                {/* 並び替え（ポップアップ内）は削除されました */}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '18px' }}>
                <button className="btn" type="button" onClick={() => {
                  setPoolFilter('all');
                  setSelectedPrios([]);
                  setAssigneeFilter('all');
                  setXpMin('');
                  setXpMax('');
                  setSortKey('name');
                  setSortOrder('asc');
                }}>クリア</button>
                <button className="btn btn-dark" type="button" onClick={() => setShowFilterPopup(false)}>適用</button>
              </div>
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '10px 0', alignItems: 'center' }}>
          <div style={{ color: '#666', fontSize: '13px' }}>
            {activeFilterCount ? `絞り込み条件 ${activeFilterCount} 件設定中` : '絞り込み条件はボタンから設定できます'}
          </div>
        </div>

        {showManageModal ? (
          <div className="overlay open" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }} onClick={(event) => { if (event.target === event.currentTarget) setShowManageModal(false); }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: 'min(760px,100%)', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 15px 45px rgba(0,0,0,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>タスク編集</h3>
                <button className="btn btn-sm" type="button" onClick={() => setShowManageModal(false)}>閉じる</button>
              </div>
              {allTasks.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>タスクはありません</div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {allTasks.map((task) => {
                    const assignee = task.to ? users.find((user) => user.id === task.to) : null;
                    return (
                      <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '14px', border: '1px solid #e5e5e5', borderRadius: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '13px', fontWeight: 500 }}>{task.name}</div>
                            <span style={{ fontSize: '11px', color: '#777' }}>{priorityBadge(task.pri)}</span>
                            <span style={{ fontSize: '11px', color: '#777' }}>{statusBadge(task.st)}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>{task.desc || '詳細なし'}</div>
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
                            担当: {assignee ? assignee.name : '未割当'} / XP +{task.xp}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          {onEditTask ? (
                            <button className="btn btn-sm" type="button" onClick={() => { onEditTask(task); setShowManageModal(false); }}>編集</button>
                          ) : null}
                          {onDeleteTask ? (
                            <button className="btn btn-sm btn-danger" type="button" onClick={() => onDeleteTask(task.id)}>削除</button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tFilter === 'all' ? (
          <div className="task-board">
            <div
              className="task-board-column task-board-droptarget"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, true)}
            >
              <div className="task-board-column-header">
                <div>ガチャプール内</div>
                <div>{poolTasks.length}</div>
              </div>
              <div className="task-board-column-list">
                {poolTasks.length === 0 ? (
                  <div className="task-board-empty">ガチャプール内のタスクはありません</div>
                ) : poolTasks.map((task) => renderTaskRow(task))}
              </div>
            </div>
            <div
              className="task-board-column task-board-droptarget"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, false)}
            >
              <div className="task-board-column-header">
                <div>プール外タスク</div>
                <div>{nonPoolTasks.length}</div>
              </div>
              <div className="task-board-column-list">
                {nonPoolTasks.length === 0 ? (
                  <div className="task-board-empty">プール外のタスクはありません</div>
                ) : nonPoolTasks.map((task) => renderTaskRow(task))}
              </div>
            </div>
          </div>
        ) : tFilter === 'progress' ? (
          <div className="task-board task-board-progress">
            {(['pending','in_progress','review','done'] as const).map((status) => (
              <div key={status} className={`task-board-column ${status}`}>
                <div className="task-board-column-header">
                  <div>{status === 'pending' ? '未着手' : status === 'in_progress' ? '進行中' : status === 'review' ? '承認待ち' : '完了'}</div>
                  <div>{filteredTasks.filter((task) => task.st === status).length}</div>
                </div>
                <div className="task-board-column-list">
                  {filteredTasks.filter((task) => task.st === status).map((task) => renderTaskRow(task))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="tbl" id="ttbl">
            <thead>
              <tr>
                <th style={{ width: '1px' }}></th>
                <th>タスク名</th>
                <th>優先度</th>
                <th>担当</th>
                <th>XP</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: '2rem', fontSize: '13px' }}>タスクはありません</td></tr>
              ) : filteredTasks.map((task) => {
                const assignee = task.to ? users.find((user) => user.id === task.to) : null;
                const inPool = !!task.inPool;
                return (
                  <tr key={task.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={inPool}
                        onChange={(e) => {
                          toggleTaskPool(task.id, e.target.checked);
                        }}
                      />
                    </td>
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
        )}
      </div>
    </div>
  );
}
