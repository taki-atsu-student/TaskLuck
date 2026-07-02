import { useEffect, useMemo, useRef, useState } from 'react';
import { Shift, ShiftAssignment, User, BusinessInfo, BusinessDayKey } from '../models';
import { ShiftGanttChart, START_MIN, END_MIN, TOTAL_MIN, STEP_MIN, toMin, toTime, roundStep } from '../components/ShiftGanttChart';

type CalendarData = { monthNames: string[]; dayNames: string[]; cells: any[] } | null;

type ShiftEditViewProps = {
  isActive: boolean;
  cal: CalendarData;
  currentMonthLabel: string;
  setCm: (fn: (prev: number) => number) => void;
  users: User[];
  shifts: Shift[];
  setShifts: (fn: (prev: Shift[]) => Shift[]) => void;
  todayIso: string;
  toast: (message: string) => void;
  onBack: () => void;
  understaffedDates: Set<string>;
  businessInfo: BusinessInfo;
};

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const ASSIGNMENT_LABELS: Record<ShiftAssignment, string> = { hall: 'ホール', kitchen: 'キッチン' };
const DOW_TO_KEY: BusinessDayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const HOLIDAYS = new Set([
  '2025-01-01','2025-01-13','2025-02-11','2025-02-23','2025-02-24','2025-03-20','2025-04-29','2025-05-03','2025-05-04','2025-05-05','2025-05-06','2025-07-21','2025-08-11','2025-09-15','2025-09-23','2025-10-13','2025-11-03','2025-11-23','2025-11-24',
  '2026-01-01','2026-01-12','2026-02-11','2026-02-23','2026-03-20','2026-04-29','2026-05-03','2026-05-04','2026-05-05','2026-05-06','2026-07-20','2026-08-11','2026-09-21','2026-09-22','2026-09-23','2026-10-12','2026-11-03'
]);

export default function ShiftEditView({ isActive, cal, currentMonthLabel, setCm, users, shifts, setShifts, todayIso, toast, onBack, understaffedDates, businessInfo }: ShiftEditViewProps) {
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editShifts, setEditShifts] = useState<Shift[]>(shifts);
  const [isDirty, setIsDirty] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoDate, setMemoDate] = useState('');
  const [memoText, setMemoText] = useState('');
  const [activeTab, setActiveTab] = useState<ShiftAssignment>('hall');
  const [addAssignments, setAddAssignments] = useState<ShiftAssignment[]>(['hall']);
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null);

  const displayUsers = useMemo(() => {
    const base = users.length ? users : [];
    const fallback: User[] = [
      { id: 9001, name: '山田 健太', role: 'part', xp: 0, ini: '山', password: '' },
      { id: 9002, name: '佐藤 花子', role: 'staff', xp: 0, ini: '佐', password: '' },
      { id: 9003, name: '田中 翔', role: 'part', xp: 0, ini: '田', password: '' },
      { id: 9004, name: '中村 葵', role: 'part', xp: 0, ini: '中', password: '' },
      { id: 9005, name: '伊藤 優', role: 'part', xp: 0, ini: '伊', password: '' },
      { id: 9006, name: '小林 拓', role: 'staff', xp: 0, ini: '小', password: '' },
      { id: 9007, name: '加藤 美咲', role: 'part', xp: 0, ini: '加', password: '' },
      { id: 9008, name: '渡辺 蓮', role: 'part', xp: 0, ini: '渡', password: '' },
      { id: 9009, name: '松本 結衣', role: 'part', xp: 0, ini: '松', password: '' },
      { id: 9010, name: '井上 陽太', role: 'part', xp: 0, ini: '井', password: '' },
    ];
    const merged = [...base];
    fallback.forEach((user) => {
      if (merged.length < 10 && !merged.some((item) => item.name === user.name)) merged.push(user);
    });
    return merged.slice(0, 10);
  }, [users]);

  const tabUsers = useMemo((): Record<ShiftAssignment, User[]> => ({
    hall: displayUsers.slice(0, 5),
    kitchen: displayUsers.slice(5, 10),
  }), [displayUsers]);

  const [addUid, setAddUid] = useState<number>(tabUsers.hall[0]?.id ?? users.find((u) => u.role === 'part')?.id ?? users[0]?.id ?? 1);
  const [addStart, setAddStart] = useState('10:00');
  const [addEnd, setAddEnd] = useState('17:00');
  const dragRef = useRef<null | { id: number; mode: 'move' | 'start' | 'end'; baseX: number; baseS: number; baseE: number; width: number }>(null);

  useEffect(() => {
    if (isActive) { setEditShifts(shifts); setIsDirty(false); }
  }, [isActive, shifts]);

  const selectedShifts = useMemo(() => (
    editShifts
      .filter((shift) => shift.date === selectedDate && shift.st === 'confirmed' && !shift.isOff)
      .sort((a, b) => toMin(a.s) - toMin(b.s))
  ), [editShifts, selectedDate]);

  const selectedTabShifts = useMemo(() => selectedShifts.filter((shift) => {
    const assignments = shift.assignments ?? [];
    if (assignments.length > 0) return assignments.includes(activeTab);
    return tabUsers[activeTab].some((user) => user.id === shift.uid);
  }), [activeTab, selectedShifts, tabUsers]);

  const visibleUsers = useMemo(() => {
    const base = tabUsers[activeTab];
    const extras = selectedTabShifts
      .map((shift) => displayUsers.find((user) => user.id === shift.uid))
      .filter((user): user is User => !!user && !base.some((b) => b.id === user!.id));
    return [...base, ...extras];
  }, [activeTab, displayUsers, selectedTabShifts, tabUsers]);

  const rowShifts = useMemo(() => visibleUsers.map((user) => ({
    user,
    shifts: selectedTabShifts.filter((shift) => shift.uid === user.id),
  })), [selectedTabShifts, visibleUsers]);

  const selectedTitle = useMemo(() => {
    const d = new Date(selectedDate);
    if (Number.isNaN(d.getTime())) return selectedDate;
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAY_LABELS[d.getDay()]}）`;
  }, [selectedDate]);

  const getCellFlags = (dateKey: string) => {
    const date = new Date(dateKey);
    const day = date.getDay();
    return {
      isSun: day === 0,
      isSat: day === 6,
      isHoliday: HOLIDAYS.has(dateKey),
      isClosed: businessInfo.regularClosedDays.includes(DOW_TO_KEY[day]),
    };
  };

  const updateShiftTime = (id: number, sMin: number, eMin: number) => {
    const start = Math.max(START_MIN, Math.min(END_MIN - STEP_MIN, roundStep(sMin)));
    const end = Math.max(start + STEP_MIN, Math.min(END_MIN, roundStep(eMin)));
    setEditShifts((prev) => prev.map((shift) => shift.id === id ? { ...shift, s: toTime(start), e: toTime(end) } : shift));
    setIsDirty(true);
  };

  const startDrag = (event: React.MouseEvent<HTMLDivElement>, shift: Shift, mode: 'move' | 'start' | 'end') => {
    event.preventDefault();
    event.stopPropagation();
    const track = (event.currentTarget.closest('.gantt-track') as HTMLElement | null);
    const width = track?.getBoundingClientRect().width ?? 1;
    dragRef.current = { id: shift.id, mode, baseX: event.clientX, baseS: toMin(shift.s), baseE: toMin(shift.e), width };

    const onMove = (moveEvent: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const deltaMin = roundStep(((moveEvent.clientX - drag.baseX) / drag.width) * TOTAL_MIN);
      if (drag.mode === 'move') {
        const duration = drag.baseE - drag.baseS;
        const nextS = Math.max(START_MIN, Math.min(END_MIN - duration, drag.baseS + deltaMin));
        updateShiftTime(drag.id, nextS, nextS + duration);
      } else if (drag.mode === 'start') {
        updateShiftTime(drag.id, Math.min(drag.baseS + deltaMin, drag.baseE - STEP_MIN), drag.baseE);
      } else {
        updateShiftTime(drag.id, drag.baseS, Math.max(drag.baseE + deltaMin, drag.baseS + STEP_MIN));
      }
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const openMemo = (dateKey: string) => {
    setMemoDate(dateKey);
    setMemoText(notes[dateKey] ?? '');
    setMemoOpen(true);
  };

  const saveMemo = () => {
    if (!memoDate) return;
    setNotes((prev) => ({ ...prev, [memoDate]: memoText.trim() }));
    setMemoOpen(false);
    toast('メモを保存しました');
  };

  const toggleAssignment = (assignment: ShiftAssignment) => {
    setAddAssignments((prev) => {
      if (prev.includes(assignment)) return prev.filter((item) => item !== assignment);
      return [...prev, assignment];
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setEditShifts((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
    setIsDirty(true);
    toast('シフトを削除しました');
  };

  const saveAll = () => {
    setShifts(() => editShifts);
    setIsDirty(false);
    toast('保存しました');
  };

  const handleBack = () => {
    if (isDirty && !window.confirm('保存されていない変更があります。戻りますか？')) return;
    onBack();
  };

  const addShift = () => {
    if (!selectedDate || !addStart || !addEnd || addAssignments.length === 0) {
      toast('入力内容を確認してください');
      return;
    }
    if (toMin(addEnd) <= toMin(addStart)) {
      toast('終了時間は開始時間より後にしてください');
      return;
    }
    setEditShifts((prev) => [...prev, { id: Date.now(), uid: addUid, date: selectedDate, s: addStart, e: addEnd, st: 'confirmed', assignments: addAssignments }]);
    setIsDirty(true);
    setAddOpen(false);
    toast('シフトを追加しました');
  };

  const autoCreate = () => {
    const monthDates = (cal?.cells ?? [])
      .filter((cell) => cell.type !== 'prev' && cell.type !== 'next')
      .map((cell) => cell.dateKey as string)
      .filter((dateKey) => !getCellFlags(dateKey).isClosed);
    if (!monthDates.length || !displayUsers.length) return;

    const templates = [
      ['09:00', '14:00'], ['10:00', '15:00'], ['11:00', '17:00'], ['13:00', '18:00'], ['17:00', '22:00'],
    ];
    const generated: Shift[] = [];
    monthDates.forEach((dateKey, dateIndex) => {
      (['hall', 'kitchen'] as ShiftAssignment[]).forEach((assignment) => {
        const groupUsers = tabUsers[assignment];
        const rotatedUsers = groupUsers.slice(dateIndex % groupUsers.length).concat(groupUsers.slice(0, dateIndex % groupUsers.length));
        rotatedUsers.slice(0, 5).forEach((user, userIndex) => {
          const tpl = templates[userIndex % templates.length];
          generated.push({
            id: Date.now() + generated.length,
            uid: user.id,
            date: dateKey,
            s: tpl[0],
            e: tpl[1],
            st: 'confirmed',
            assignments: [assignment],
          });
        });
      });
    });

    const monthSet = new Set(monthDates);
    setEditShifts((prev) => [
      ...prev.filter((shift) => !monthSet.has(shift.date)),
      ...generated,
    ]);
    setIsDirty(true);
    toast('1か月分のシフトを自動作成しました');
  };

  return (
    <div className={`page ${isActive ? 'show' : ''}`} id="pg-shift-edit">
      <div className="ph">
        <div>
          <div className="pt">シフト編集</div>
        </div>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          <button className="btn" type="button" onClick={handleBack}>← 戻る</button>
          <button className="btn" type="button" onClick={autoCreate}>シフト自動作成</button>
          <button className="btn btn-dark" type="button" onClick={saveAll}>保存</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        {cal ? (
          <>
            <div className="cal-nav">
              <button className="btn btn-sm" type="button" onClick={() => setCm((prev) => prev - 1 < 0 ? 11 : prev - 1)}>‹‹</button>
              <span className="cal-month">{currentMonthLabel}</span>
              <button className="btn btn-sm" type="button" onClick={() => setCm((prev) => prev + 1 > 11 ? 0 : prev + 1)}>››</button>
            </div>
            <div className="cal-grid shift-edit-cal">
              {cal.dayNames.map((dn, i) => (
                <div className="cal-dn" key={dn} style={{ color: i === 0 ? '#e0506a' : i === 6 ? '#4b9be0' : undefined }}>{dn}</div>
              ))}
              {cal.cells.map((cell, idx) => {
                if (cell.type === 'prev' || cell.type === 'next') return <div className="cal-cell other" key={idx}><div className="cal-n">{cell.dateNumber}</div></div>;
                const isSelected = cell.dateKey === selectedDate;
                const note = notes[cell.dateKey];
                const flags = getCellFlags(cell.dateKey);
                return (
                  <div
                    className={`cal-cell edit-cell${cell.isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${flags.isSun || flags.isHoliday ? ' day-red' : ''}${flags.isSat ? ' day-blue' : ''}${!flags.isClosed && understaffedDates.has(cell.dateKey) ? ' understaffed' : ''}${flags.isClosed ? ' closed' : ''}`}
                    key={cell.dateKey}
                    onClick={() => setSelectedDate(cell.dateKey)}
                    onDoubleClick={(event) => { event.preventDefault(); event.stopPropagation(); openMemo(cell.dateKey); }}
                    title={note ? note : ''}
                  >
                    <div className="cal-n">{cell.day}</div>
                    {flags.isClosed ? <div className="edit-closed-label">定休日</div> : null}
                    {note ? <div className="cal-note">{note}</div> : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>

      <div className="card shift-gantt-card">
        <div className="shift-edit-head">
          <div>
            <div className="sec-lbl">{selectedTitle} のシフト</div>
            <div className="ps">バーをドラッグ：移動 ／ 端をドラッグ：開始・終了を15分単位で変更</div>
          </div>
          <button className="btn btn-dark" type="button" onClick={() => { setAddUid(visibleUsers[0]?.id ?? addUid); setAddAssignments([activeTab]); setAddOpen(true); }}>+ 追加</button>
        </div>
        <ShiftGanttChart
          activeTab={activeTab}
          onTabChange={setActiveTab}
          rowShifts={rowShifts}
          onBarMouseDown={startDrag}
          onBarDeleteRequest={(shift) => setDeleteTarget(shift)}
          emptyMessage="この日のシフトはありません。「追加」または「シフト自動作成」で作成してください。"
        />
      </div>

      <div className={`overlay ${addOpen ? 'open' : ''}`} onClick={(event) => { if (event.target === event.currentTarget) setAddOpen(false); }}>
        <div className="modal">
          <h3>シフトを追加</h3>
          <div className="mfg"><label>日付</label><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></div>
          <div className="mfg"><label>スタッフ</label><select value={addUid} onChange={(event) => setAddUid(Number(event.target.value))}>{displayUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></div>
          <div className="mfg">
            <label>担当（複数選択可）</label>
            <div className="assignment-checks">
              {(['hall', 'kitchen'] as ShiftAssignment[]).map((assignment) => (
                <label className={`assignment-check${addAssignments.includes(assignment) ? ' active' : ''}`} key={assignment}>
                  <input type="checkbox" checked={addAssignments.includes(assignment)} onChange={() => toggleAssignment(assignment)} />
                  <span>{ASSIGNMENT_LABELS[assignment]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mfg"><label>開始</label><input type="time" step="900" value={addStart} onChange={(event) => setAddStart(event.target.value)} /></div>
          <div className="mfg"><label>終了</label><input type="time" step="900" value={addEnd} onChange={(event) => setAddEnd(event.target.value)} /></div>
          <div className="mf">
            <button className="btn" type="button" onClick={() => setAddOpen(false)}>キャンセル</button>
            <button className="btn btn-dark" type="button" onClick={addShift}>追加</button>
          </div>
        </div>
      </div>

      <div className={`overlay ${memoOpen ? 'open' : ''}`} onClick={(event) => { if (event.target === event.currentTarget) setMemoOpen(false); }}>
        <div className="modal">
          <h3>メモ入力</h3>
          <div className="mfg"><label>日付</label><input type="text" value={memoDate} readOnly /></div>
          <div className="mfg"><label>メモ</label><textarea rows={4} value={memoText} onChange={(event) => setMemoText(event.target.value)} placeholder="メモを入力" /></div>
          <div className="mf">
            <button className="btn" type="button" onClick={() => setMemoOpen(false)}>キャンセル</button>
            <button className="btn btn-dark" type="button" onClick={saveMemo}>保存</button>
          </div>
        </div>
      </div>

      <div className={`overlay ${deleteTarget ? 'open' : ''}`} onClick={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}>
        <div className="modal">
          <h3>シフトを削除</h3>
          <p style={{ fontSize: '13px', color: '#555', margin: '8px 0 16px' }}>
            {deleteTarget ? `${deleteTarget.s}〜${deleteTarget.e} のシフトを削除しますか？` : ''}
          </p>
          <div className="mf">
            <button className="btn" type="button" onClick={() => setDeleteTarget(null)}>キャンセル</button>
            <button className="btn btn-danger" type="button" onClick={confirmDelete}>削除</button>
          </div>
        </div>
      </div>
    </div>
  );
}
