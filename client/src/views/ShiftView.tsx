import { useMemo, useState } from 'react';
import { Shift, ShiftAssignment, User, BusinessInfo, BusinessDayKey } from '../models';
import { ShiftGanttChart, toMin } from '../components/ShiftGanttChart';

type ShiftViewProps = {
  isActive: boolean;
  isMgr: boolean;
  isStf: boolean;
  onOpenShiftRequest: () => void;
  onOpenShiftCreate: () => void;
  cal: { monthNames: string[]; dayNames: string[]; cells: any[] } | null;
  currentMonthLabel: string;
  setCm: (fn: (prev: number) => number) => void;
  shifts: Shift[];
  todayIso: string;
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
  onShiftRequestSubmit: () => void;
  onShiftCreateSubmit: () => void;
  businessInfo: BusinessInfo;
  understaffedDates: Set<string>;
};

const DOW_TO_KEY: BusinessDayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export function ShiftView({ isActive, isMgr, isStf, onOpenShiftRequest, onOpenShiftCreate, cal, currentMonthLabel, setCm, shifts, todayIso, users, toast, setShifts, csUid, setCsUid, csDate, setCsDate, csStart, setCsStart, csEnd, setCsEnd, onShiftRequestSubmit, onShiftCreateSubmit, businessInfo, understaffedDates }: ShiftViewProps) {
  const [activeTab, setActiveTab] = useState<ShiftAssignment>('hall');

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

  const todayTitle = useMemo(() => {
    const d = new Date(todayIso);
    if (Number.isNaN(d.getTime())) return todayIso;
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAY_LABELS[d.getDay()]}）`;
  }, [todayIso]);

  const todayTabShifts = useMemo(() => (
    shifts
      .filter((shift) => shift.date === todayIso && shift.st === 'confirmed' && !shift.isOff)
      .filter((shift) => {
        const assignments = shift.assignments ?? [];
        if (assignments.length > 0) return assignments.includes(activeTab);
        return tabUsers[activeTab].some((user) => user.id === shift.uid);
      })
      .sort((a, b) => toMin(a.s) - toMin(b.s))
  ), [activeTab, shifts, tabUsers, todayIso]);

  const visibleUsers = useMemo(() => {
    const base = tabUsers[activeTab];
    const extras = todayTabShifts
      .map((shift) => displayUsers.find((user) => user.id === shift.uid))
      .filter((user): user is User => !!user && !base.some((b) => b.id === user.id));
    return [...base, ...extras];
  }, [activeTab, displayUsers, tabUsers, todayTabShifts]);

  const rowShifts = useMemo(() => visibleUsers.map((user) => ({
    user,
    shifts: todayTabShifts.filter((shift) => shift.uid === user.id),
  })), [todayTabShifts, visibleUsers]);
  return (
    <div className={`page ${isActive ? 'show' : ''}`} id="pg-shift">
      <div className="ph">
        <div><div className="pt">シフト管理</div></div>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          <button className="btn" type="button" onClick={onOpenShiftRequest}>+ 希望を提出</button>
          {isMgr || isStf ? <button className="btn btn-dark" id="btn-cs" type="button" onClick={onOpenShiftCreate}>{'+ シフト作成'}</button> : null}
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
            <div className="cal-grid">
              {cal.dayNames.map((dn, i) => (
                <div
                  className="cal-dn"
                  key={dn}
                  style={{ color: i === 0 ? '#e0506a' : i === 6 ? '#4b9be0' : undefined }}
                >
                  {dn}
                </div>
              ))}
              {cal.cells.map((cell, idx) => {
                if (cell.type === 'prev' || cell.type === 'next') return <div className="cal-cell other" key={idx}><div className="cal-n">{cell.dateNumber}</div></div>;
                const dow = cell.dateKey ? new Date(cell.dateKey).getDay() : -1;
                const closed = dow >= 0 && businessInfo.regularClosedDays.includes(DOW_TO_KEY[dow]);
                return (
                  <div className={`cal-cell${cell.isToday ? ' today' : ''}${!closed && understaffedDates.has(cell.dateKey) ? ' understaffed' : ''}${closed ? ' closed' : ''}`} key={cell.dateKey} style={closed ? { background: '#dcf6e5' } : undefined}>
                    <div className="cal-n" style={{ color: dow === 0 ? '#e0506a' : dow === 6 ? '#4b9be0' : undefined }}>{cell.day}</div>
                    {closed ? (
                      <div style={{ fontSize: '10px', color: '#2f9e57', fontWeight: 600, textAlign: 'center', marginTop: '2px' }}>定休日</div>
                    ) : cell.myShift ? (
                      <div className="cal-ev cal-ev-me">{cell.myShift.s.slice(0, 5)}-{cell.myShift.e.slice(0, 5)}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
      <div className="card shift-gantt-card">
        <div className="sec-lbl">{todayTitle} のシフト</div>
        <ShiftGanttChart
          activeTab={activeTab}
          onTabChange={setActiveTab}
          rowShifts={rowShifts}
          readOnly
          emptyMessage="本日のシフトはありません。"
        />
      </div>
    </div>
  );
}
