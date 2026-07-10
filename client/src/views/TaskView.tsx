import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editNotice, setEditNotice] = useState('');
  const editNoticeTimeout = useRef<number | null>(null);
  const [dragTaskId, setDragTaskId] = useState<number | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

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

  const toggleTaskSelection = (taskId: number, selected: boolean) => {
    setSelectedTaskIds((prev) => selected ? [...prev, taskId] : prev.filter((id) => id !== taskId));
  };

  const selectedCount = selectedTaskIds.length;
  const selectedTask = selectedCount === 1 ? allTasks.find((task) => task.id === selectedTaskIds[0]) : undefined;
  const isAllTab = tFilter === 'all';
  const mobileTabs = [
    { key: 'all', label: 'すべて' },
    { key: 'pool-in', label: 'プール内' },
    { key: 'pool-out', label: 'プール外' },
    { key: 'progress', label: '進行状況' },
    { key: 'done', label: '完了' },
  ] as const;

  const handleTabSelect = (key: 'all' | 'progress' | 'done' | 'pool-in' | 'pool-out') => {
    if (key === 'all') {
      setTFilter('all');
      setPoolFilter('all');
      return;
    }
    if (key === 'progress') {
      setTFilter('progress');
      return;
    }
    if (key === 'done') {
      setTFilter('done');
      return;
    }
    if (key === 'pool-in') {
      setPoolFilter('in');
      return;
    }
    setPoolFilter('out');
  };

  const isTabActive = (key: 'all' | 'progress' | 'done' | 'pool-in' | 'pool-out') => {
    if (key === 'all') return tFilter === 'all' && poolFilter === 'all';
    if (key === 'progress') return tFilter === 'progress';
    if (key === 'done') return tFilter === 'done';
    if (key === 'pool-in') return poolFilter === 'in';
    return poolFilter === 'out';
  };

  useEffect(() => {
    if (editNoticeTimeout.current) {
      window.clearTimeout(editNoticeTimeout.current);
      editNoticeTimeout.current = null;
    }
    if (!editNotice) return;
    editNoticeTimeout.current = window.setTimeout(() => {
      setEditNotice('');
      editNoticeTimeout.current = null;
    }, 5000);
    return () => {
      if (editNoticeTimeout.current) {
        window.clearTimeout(editNoticeTimeout.current);
        editNoticeTimeout.current = null;
      }
    };
  }, [editNotice]);

  const handleDeleteSelected = () => {
    if (!onDeleteTask) return;
    selectedTaskIds.forEach((taskId) => onDeleteTask(taskId));
    setSelectedTaskIds([]);
    setShowDeleteConfirm(false);
    setEditNotice('');
  };

  const renderTaskRow = (task: Task, showCheckbox: boolean) => {
    const assignee = task.to ? users.find((user) => user.id === task.to) : null;
    const selected = selectedTaskIds.includes(task.id);
    return (
      <div
        key={task.id}
        className={`task-board-row${dragTaskId === task.id ? ' dragging' : ''}`}
        draggable
        onDragStart={() => handleDragStart(task.id)}
      >
        <div className="task-row-main">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => toggleTaskSelection(task.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="task-row-content">
            <div className="task-row-title">{task.name}</div>
            <div className="task-row-desc">{task.desc}</div>
            <div className="task-row-meta">
              <span>{assignee ? assignee.name : '未割当'}</span>
              <span>+{task.xp}XP</span>
            </div>
          </div>
        </div>
        <div className="task-row-actions">
          {priorityBadge(task.pri)}
          {renderTaskActions(task)}
        </div>
      </div>
    );
  };

  return (
    <div className={`page task-view-page ${isActive ? 'show' : ''}`} id="pg-task">
      <div className="ph">
        <div><div className="pt">タスク管理</div></div>
        {isStf ? (
          <div className="task-actions-row">
            <button
              className="btn btn-dark"
              type="button"
              disabled={selectedCount === 0 || !onEditTask}
              onClick={() => {
                if (selectedCount > 1) {
                  setEditNotice('編集したいタスクにのみチェックを入れてください');
                  return;
                }
                if (selectedTask && onEditTask) {
                  onEditTask(selectedTask);
                }
              }}
            >
              タスク編集
            </button>
            <button
              className="btn btn-dark"
              type="button"
              disabled={selectedCount === 0}
              onClick={() => {
                if (selectedCount === 0) return;
                setShowDeleteConfirm(true);
              }}
            >
              タスク削除
            </button>
            <button className="btn btn-dark" id="btn-ct" type="button" onClick={onOpenTaskModal}>+ タスク追加</button>
          </div>
        ) : null}
      </div>
      <div className="card">
        <div className="task-toolbar">
          <div className="tabs desktop-tabs">
            {(['all','progress','done'] as const).map((filter) => (
              <button key={filter} className={`tab ${tFilter === filter ? 'active' : ''}`} type="button" onClick={() => setTFilter(filter)}>
                {filter === 'all' ? 'すべて' : filter === 'progress' ? '進行状況' : '完了'}
              </button>
            ))}
          </div>
          <div className="tabs mobile-tabs">
            {mobileTabs.map((tab) => (
              <button key={tab.key} className={`tab ${isTabActive(tab.key) ? 'active' : ''}`} type="button" onClick={() => handleTabSelect(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="task-toolbar-controls">
            <div className="task-pool-count">{allTasks.filter((t) => t.inPool).length}/{allTasks.length} プール</div>
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
              <div className="filter-grid">
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
                    <input type="number" value={xpMin} min={0} onChange={(e) => setXpMin(e.target.value === '' ? '' : Number(e.target.value))} placeholder="最小" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e5e5', fontSize: '13px' }} />
                    <input type="number" value={xpMax} min={0} onChange={(e) => setXpMax(e.target.value === '' ? '' : Number(e.target.value))} placeholder="最大" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e5e5', fontSize: '13px' }} />
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

        {editNotice ? (
          <div style={{ margin: '10px 0', padding: '10px', borderRadius: '8px', backgroundColor: '#fdecea', color: '#b02a37', fontSize: '13px' }}>
            {editNotice}
          </div>
        ) : null}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', margin: '10px 0', alignItems: 'center' }}>
          <div style={{ color: '#666', fontSize: '13px' }}>
            {activeFilterCount ? `絞り込み条件 ${activeFilterCount} 件設定中` : null}
          </div>
        </div>

        {showDeleteConfirm ? (
          <div className="overlay open" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }} onClick={(event) => { if (event.target === event.currentTarget) setShowDeleteConfirm(false); }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: 'min(420px,100%)', boxShadow: '0 15px 45px rgba(0,0,0,0.12)' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>タスク削除の確認</h3>
              </div>
              <div style={{ color: '#333', fontSize: '14px', lineHeight: 1.6 }}>
                選択中の {selectedCount} 件のタスクを削除します。
                この操作は元に戻せません。よろしいですか？
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button className="btn" type="button" onClick={() => setShowDeleteConfirm(false)}>キャンセル</button>
                <button className="btn btn-danger" type="button" onClick={handleDeleteSelected}>削除</button>
              </div>
            </div>
          </div>
        ) : null}

        {tFilter === 'all' ? (
          <>
            <div className="task-board desktop-only">
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
                  ) : poolTasks.map((task) => renderTaskRow(task, true))}
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
                  ) : nonPoolTasks.map((task) => renderTaskRow(task, true))}
                </div>
              </div>
            </div>

            <div className="task-board mobile-only">
              <div className="task-board-column">
                <div className="task-board-column-header">
                  <div>タスク</div>
                  <div>{filteredTasks.length}</div>
                </div>
                <div className="task-board-column-list">
                  {filteredTasks.length === 0 ? (
                    <div className="task-board-empty">タスクはありません</div>
                  ) : filteredTasks.map((task) => renderTaskRow(task, true))}
                </div>
              </div>
            </div>
          </>
        ) : tFilter === 'progress' ? (
          <div className="task-board task-board-progress">
            {(['pending','in_progress','review','done'] as const).map((status) => (
              <div key={status} className={`task-board-column ${status}`}>
                <div className="task-board-column-header">
                  <div>{status === 'pending' ? '未着手' : status === 'in_progress' ? '進行中' : status === 'review' ? '承認待ち' : '完了'}</div>
                  <div>{filteredTasks.filter((task) => task.st === status).length}</div>
                </div>
                <div className="task-board-column-list">
                  {filteredTasks.filter((task) => task.st === status).map((task) => renderTaskRow(task, false))}
                </div>
              </div>
            ))}
          </div>
        ) : tFilter === 'done' ? (
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
                const selected = selectedTaskIds.includes(task.id);
                return (
                  <tr key={task.id}>
                    <td style={{ textAlign: 'center' }}>
                      {isAllTab ? (
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => toggleTaskSelection(task.id, e.target.checked)}
                        />
                      ) : null}
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
        ) : null}
      </div>
    </div>
  );
}
