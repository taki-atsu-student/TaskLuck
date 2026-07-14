import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
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
  cm: number;
  cy: number;
  setCm: Dispatch<SetStateAction<number>>;
  setCy: Dispatch<SetStateAction<number>>;
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

export function ShiftView({ isActive, isMgr, isStf, onOpenShiftRequest, onOpenShiftCreate, cal, currentMonthLabel, cm, cy, setCm, setCy, shifts, todayIso, users, toast, setShifts, csUid, setCsUid, csDate, setCsDate, csStart, setCsStart, csEnd, setCsEnd, onShiftRequestSubmit, onShiftCreateSubmit, businessInfo, understaffedDates }: ShiftViewProps) {
  const [activeTab, setActiveTab] = useState<ShiftAssignment>('hall');
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [showPdfPopup, setShowPdfPopup] = useState(false);

  const pdfMonthInfo = useMemo(() => {
    const firstDayCell = cal?.cells.find((cell: any) => cell.type === 'day' && typeof cell.dateKey === 'string');
    if (firstDayCell && typeof firstDayCell.dateKey === 'string') {
      const [year, month] = firstDayCell.dateKey.split('-').map((value: string) => Number(value));
      return { year, month };
    }
    const d = new Date(todayIso);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, [cal, todayIso]);

  const pdfUsers = useMemo(() => [...users].sort((a, b) => a.name.localeCompare(b.name, 'ja')), [users]);

  const pdfDays = useMemo(() => Array.from({ length: 31 }, (_, index) => index + 1), []);

  const pdfRows = useMemo(() => {
    const { year, month } = pdfMonthInfo;
    const pad = (value: number) => String(value).padStart(2, '0');
    return pdfUsers.map((user) => ({
      user,
      cells: pdfDays.map((day) => {
        const dateKey = `${year}-${pad(month)}-${pad(day)}`;
        const dayShifts = shifts.filter((shift) => shift.uid === user.id && shift.date === dateKey && shift.st === 'confirmed' && !shift.isOff);
        return dayShifts.length > 0 ? dayShifts.map((shift) => `${shift.s}-${shift.e}`).join(', ') : '';
      }),
    }));
  }, [pdfUsers, pdfDays, pdfMonthInfo, shifts]);

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return window.btoa(binary);
  };

  const loadJpFontBase64 = async () => {
    const response = await fetch('/fonts/NotoSansJP-wght.ttf');
    if (!response.ok) throw new Error('日本語フォントの読み込みに失敗しました');
    const buffer = await response.arrayBuffer();
    return arrayBufferToBase64(buffer);
  };

  const handleDownloadPdf = async () => {
    const { year, month } = pdfMonthInfo;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });

    const fontBase64 = await loadJpFontBase64();
    doc.addFileToVFS('NotoSansJP-wght.ttf', fontBase64);
    doc.addFont('NotoSansJP-wght.ttf', 'NotoSansJP', 'normal');
    doc.setFont('NotoSansJP', 'normal');

    const title = `${year}年${month}月シフト表`;
    const margin = 10;
    const startX = margin;
    const titleY = 20;
    const startY = 34;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageRight = pageWidth - margin;
    const staffColWidth = 26;
    const colWidth = Math.max(10, (pageRight - startX - staffColWidth) / pdfDays.length);
    const rowHeight = 12;
    const tableWidth = staffColWidth + colWidth * pdfDays.length;
    const headerTop = startY - 7;
    const tableHeight = rowHeight * (pdfRows.length + 1);
    const tableBottom = headerTop + tableHeight;
    const tableRight = startX + tableWidth;

    doc.setFontSize(18);
    doc.text(title, startX, titleY);
    doc.setFontSize(12);
    doc.text('スタッフ', startX + staffColWidth / 2, startY, { align: 'center' });
    pdfDays.forEach((day, index) => {
      doc.text(`${month}/${day}`, startX + staffColWidth + colWidth * index + colWidth / 2, startY, { align: 'center', maxWidth: colWidth - 1 });
    });

    doc.setFontSize(10);
    let y = startY + rowHeight;
    pdfRows.forEach((row) => {
      doc.text(row.user.name, startX + staffColWidth / 2, y, { align: 'center', maxWidth: staffColWidth - 2 });
      row.cells.forEach((text, index) => {
        const x = startX + staffColWidth + colWidth * index + colWidth / 2;
        if (text) {
          doc.text(text, x, y, { align: 'center', maxWidth: colWidth - 1 });
        }
      });
      y += rowHeight;
    });

    doc.setDrawColor(0);
    doc.setLineWidth(0.15);
    for (let rowIndex = 0; rowIndex <= pdfRows.length + 1; rowIndex += 1) {
      const lineY = headerTop + rowIndex * rowHeight;
      doc.line(startX, lineY, tableRight, lineY);
    }
    doc.line(startX, headerTop, startX, tableBottom);
    doc.line(startX + staffColWidth, headerTop, startX + staffColWidth, tableBottom);
    for (let i = 0; i <= pdfDays.length; i += 1) {
      const x = startX + staffColWidth + colWidth * i;
      doc.line(x, headerTop, x, tableBottom);
    }
    doc.line(tableRight, headerTop, tableRight, tableBottom);

    doc.save(`${year}-${String(month).padStart(2, '0')}-shift-table.pdf`);
  };

  const displayUsers = useMemo(() => {
    return users;
  }, [users]);

  const tabUsers = useMemo((): Record<ShiftAssignment, User[]> => ({
    hall: displayUsers.slice(0, 5),
    kitchen: displayUsers.slice(5, 10),
  }), [displayUsers]);

  const todayTitle = useMemo(() => {
    const d = new Date(selectedDate);
    if (Number.isNaN(d.getTime())) return selectedDate;
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAY_LABELS[d.getDay()]}）`;
  }, [selectedDate]);

  const todayTabShifts = useMemo(() => (
    shifts
      .filter((shift) => shift.date === selectedDate && shift.st === 'confirmed' && !shift.isOff)
      .filter((shift) => {
        const assignments = shift.assignments ?? [];
        if (assignments.length > 0) return assignments.includes(activeTab);
        return tabUsers[activeTab].some((user) => user.id === shift.uid);
      })
      .sort((a, b) => toMin(a.s) - toMin(b.s))
  ), [activeTab, shifts, tabUsers, selectedDate]);

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

  const navigateMonth = (direction: -1 | 1) => {
    if (direction === -1) {
      if (cm === 0) {
        setCm(11);
        setCy((year) => (year > 1980 ? year - 1 : 1980));
      } else {
        setCm(cm - 1);
      }
      return;
    }

    if (cm === 11) {
      setCm(0);
      setCy((year) => year + 1);
    } else {
      setCm(cm + 1);
    }
  };

  return (
    <div className={`page ${isActive ? 'show' : ''}`} id="pg-shift">
      <div className="ph">
        <div><div className="pt">シフト管理</div></div>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
          {isMgr || isStf ? <button className="btn btn-sm" type="button" onClick={() => setShowPdfPopup(true)}>PDF出力</button> : null}
          <button className="btn" type="button" onClick={onOpenShiftRequest}>+ 希望を提出</button>
          {isMgr || isStf ? <button className="btn btn-dark" id="btn-cs" type="button" onClick={onOpenShiftCreate}>{'+ シフト作成'}</button> : null}
        </div>
      </div>
      {showPdfPopup ? (
        <div className="overlay open" onClick={(event) => { if (event.target === event.currentTarget) setShowPdfPopup(false); }}>
          <div className="modal pdf-modal">
            <h3>{`${pdfMonthInfo.year}年${pdfMonthInfo.month}月 シフト出力プレビュー`}</h3>
            <div className="pdf-preview">
              <table className="pdf-table">
                <thead>
                  <tr>
                    <th>スタッフ</th>
                    {pdfDays.map((day) => (
                      <th key={day}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pdfRows.map((row) => (
                    <tr key={row.user.id}>
                      <td>{row.user.name}</td>
                      {row.cells.map((text, index) => (
                        <td key={index}>{text || ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {pdfRows.length === 0 ? <div style={{ padding: '16px 0', color: '#555' }}>シフトまたはスタッフのデータがありません。</div> : null}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn" type="button" onClick={() => setShowPdfPopup(false)}>閉じる</button>
              <button className="btn btn-dark" type="button" onClick={handleDownloadPdf}>出力</button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="card" style={{ marginBottom: '12px' }}>
        {cal ? (
          <>
            <div className="cal-nav">
              <button className="btn btn-sm" type="button" onClick={() => navigateMonth(-1)}>‹‹</button>
              <span className="cal-month">{currentMonthLabel}</span>
              <button className="btn btn-sm" type="button" onClick={() => navigateMonth(1)}>››</button>
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
                const isSelected = cell.dateKey === selectedDate;
                return (
                  <button
                    type="button"
                    className={`cal-cell${cell.isToday ? ' today' : ''}${!closed && understaffedDates.has(cell.dateKey) ? ' understaffed' : ''}${closed ? ' closed' : ''}${isSelected ? ' selected' : ''}`}
                    key={cell.dateKey}
                    style={closed ? { background: '#dcf6e5' } : isSelected ? { background: '#e3f2fd', borderColor: '#2196F3', borderWidth: '2px' } : undefined}
                    onClick={() => setSelectedDate(cell.dateKey)}
                  >
                    <div className="cal-n" style={{ color: dow === 0 ? '#e0506a' : dow === 6 ? '#4b9be0' : undefined }}>{cell.day}</div>
                    {closed ? (
                      <div style={{ fontSize: '10px', color: '#2f9e57', fontWeight: 600, textAlign: 'center', marginTop: '2px' }}>定休日</div>
                    ) : cell.myShift ? (
                      <div className="cal-ev cal-ev-me">{cell.myShift.s.slice(0, 5)}-{cell.myShift.e.slice(0, 5)}</div>
                    ) : null}
                  </button>
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
          emptyMessage="このシフトはありません。"
        />
      </div>
    </div>
  );
}
