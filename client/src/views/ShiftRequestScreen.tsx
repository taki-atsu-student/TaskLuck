import React, { useState } from "react";
import { Dispatch, SetStateAction } from "react";
import { User, ShiftPattern, BusinessInfo, BusinessDayKey } from "../models";

type CalCell = {
  type: "prev" | "day" | "next";
  dateNumber?: number;
  day?: number;
  dateKey?: string;
  dayShifts?: unknown[];
  myShift?: unknown;
  isToday?: boolean;
};

type Cal = {
  monthNames: string[];
  dayNames: string[];
  cells: CalCell[];
} | null;

export interface ShiftRequestEntry {
  date: string;
  patternId: number;
}

interface ShiftRequestScreenProps {
  isActive: boolean;
  currentUser: User;
  cal: Cal;
  currentMonthLabel: string;
  setCm: Dispatch<SetStateAction<number>>;
  users: User[];
  shiftPatterns: ShiftPattern[];
  setShiftPatterns: Dispatch<SetStateAction<ShiftPattern[]>>;
  reqDate: string;
  setReqDate: (value: string) => void;
  onSubmit: (entries: ShiftRequestEntry[]) => void;
  onCancel: () => void;
  businessInfo: BusinessInfo;
}

const DOW_TO_KEY: BusinessDayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const PALETTE = [
  { bg: "#dcfce7", fg: "#15803d" },
  { bg: "#dbeafe", fg: "#1d4ed8" },
  { bg: "#fef3c7", fg: "#b45309" },
  { bg: "#ede9fe", fg: "#6d28d9" },
  { bg: "#fce7f3", fg: "#be185d" },
];

export default function ShiftRequestScreen({
  isActive,
  currentUser,
  cal,
  currentMonthLabel,
  setCm,
  users,
  shiftPatterns,
  setShiftPatterns,
  reqDate,
  setReqDate,
  onSubmit,
  onCancel,
  businessInfo,
}: ShiftRequestScreenProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [registeredShifts, setRegisteredShifts] = useState<Record<string, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    workStart: "09:00",
    workEnd: "17:00",
    breakTime: 0,
    memo: "",
  });

  const colorFor = (pid: number) => {
    const idx = shiftPatterns.findIndex((p) => p.id === pid);
    return PALETTE[idx % PALETTE.length] || PALETTE[0];
  };

  const handleSelectDate = (dateKey: string, dow: number) => {
    if (businessInfo.regularClosedDays.includes(DOW_TO_KEY[dow])) return;
    setSelectedDate((prev) => (prev === dateKey ? null : dateKey));
    setReqDate(dateKey);
  };

  const registerPattern = (pid: number) => {
    if (!selectedDate) return;
    setRegisteredShifts((prev) => ({ ...prev, [selectedDate]: pid }));
  };

  const removeShift = (dateKey: string) => {
    setRegisteredShifts((prev) => {
      const next = { ...prev };
      delete next[dateKey];
      return next;
    });
  };

  const handleSubmit = () => {
    const entries = Object.entries(registeredShifts).map(([date, patternId]) => ({
      date,
      patternId,
    }));
    onSubmit(entries);
  };

  const addPattern = () => {
    if (!draft.title.trim()) return;
    const id = shiftPatterns.length
      ? Math.max(...shiftPatterns.map((p) => p.id)) + 1
      : 1;
    setShiftPatterns((ps) => [
      ...ps,
      {
        id,
        title: draft.title.trim(),
        workStart: draft.workStart,
        workEnd: draft.workEnd,
        breakTime:
          typeof draft.breakTime === "string"
            ? parseInt(draft.breakTime, 10) || 0
            : draft.breakTime,
        memo: draft.memo.trim(),
      },
    ]);
    setDraft({ title: "", workStart: "09:00", workEnd: "17:00", breakTime: 0, memo: "" });
    setShowForm(false);
  };

  const deletePattern = (pid: number) => {
    setShiftPatterns((ps) => ps.filter((p) => p.id !== pid));
    setRegisteredShifts((prev) => {
      const next: Record<string, number> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (v !== pid) next[k] = v;
      }
      return next;
    });
  };

  const selLabel = selectedDate
    ? `${Number(selectedDate.split("-")[1])}月${Number(selectedDate.split("-")[2])}日`
    : null;

  const submitCount = Object.keys(registeredShifts).length;

  return (
    <div className={`page ${isActive ? "show" : ""}`} id="pg-shift-request">
      <style>{`
        .sr-cell { position: relative; cursor: pointer; }
        .sr-cell.sel { box-shadow: 0 0 0 2px #4b9be0; background: transparent !important; }
        .sr-cell.closed { background: #dcf6e5 !important; cursor: default; }
        .sr-cell.closed:hover { background: #dcf6e5 !important; }
        .sr-shift { display: flex; align-items: center; justify-content: center; margin-top: 4px; font-size: 10px; font-weight: 600; border-radius: 5px; padding: 3px 5px; line-height: 1.2; width: 100%; box-sizing: border-box; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sr-x { position: absolute; top: 2px; right: 2px; width: 14px; height: 14px; border: none; border-radius: 50%; background: #1d1d1f; color: #fff; font-size: 10px; line-height: 1; cursor: pointer; opacity: 0; transition: opacity .12s; display: flex; align-items: center; justify-content: center; padding: 0; z-index: 1; }
        .sr-cell:hover .sr-x { opacity: 1; }
        .sr-x:hover { background: #d8413f; }
      `}</style>

      <div className="ph">
        <div>
          <div className="pt">シフト希望提出</div>
        </div>
        <div style={{ display: "flex", gap: "7px" }}>
          <button className="btn" type="button" onClick={onCancel}>
            ← 戻る
          </button>
          <button
            className="btn"
            type="button"
            style={{ background: "#34c759", borderColor: "#34c759", color: "#fff" }}
            onClick={handleSubmit}
          >
            シフト提出{submitCount > 0 ? `（${submitCount}件）` : ""}
          </button>
        </div>
      </div>

      {/* calendar */}
      <div className="card" style={{ marginBottom: "12px" }}>
        {cal ? (
          <>
            <div className="cal-nav">
              <button
                className="btn btn-sm"
                type="button"
                onClick={() => setCm((prev) => (prev - 1 < 0 ? 11 : prev - 1))}
              >
                ‹‹
              </button>
              <span className="cal-month">{currentMonthLabel}</span>
              <button
                className="btn btn-sm"
                type="button"
                onClick={() => setCm((prev) => (prev + 1 > 11 ? 0 : prev + 1))}
              >
                ››
              </button>
            </div>
            <div className="cal-grid">
              {cal.dayNames.map((dn, i) => (
                <div
                  className="cal-dn"
                  key={dn}
                  style={{ color: i === 0 ? "#e0506a" : i === 6 ? "#4b9be0" : undefined }}
                >
                  {dn}
                </div>
              ))}
              {cal.cells.map((cell, idx) => {
                if (cell.type === "prev" || cell.type === "next") {
                  return (
                    <div className="cal-cell other" key={idx}>
                      <div className="cal-n">{cell.dateNumber}</div>
                    </div>
                  );
                }

                const dow = cell.dateKey ? new Date(cell.dateKey).getDay() : -1;
                const closed = dow >= 0 && businessInfo.regularClosedDays.includes(DOW_TO_KEY[dow]);
                const isSel = cell.dateKey === selectedDate;
                const pid = cell.dateKey ? registeredShifts[cell.dateKey] : undefined;
                const pattern = pid != null ? shiftPatterns.find((p) => p.id === pid) : null;
                const col = pattern ? colorFor(pattern.id) : null;

                return (
                  <div
                    className={`cal-cell sr-cell${cell.isToday ? " today" : ""}${isSel ? " sel" : ""}${closed ? " closed" : ""}`}
                    key={cell.dateKey}
                    onClick={() => cell.dateKey && handleSelectDate(cell.dateKey, dow)}
                  >
                    <div className="cal-n" style={{ color: dow === 0 ? "#e0506a" : dow === 6 ? "#4b9be0" : undefined }}>{cell.day}</div>
                    {closed && (
                      <div style={{ fontSize: "10px", color: "#2f9e57", fontWeight: 600, textAlign: "center", marginTop: "2px" }}>
                        定休日
                      </div>
                    )}
                    {pattern && col && !closed && (
                      <span className="sr-shift" style={{ background: col.bg, color: col.fg }}>
                        {pattern.workStart}～{pattern.workEnd}
                        <button
                          className="sr-x"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (cell.dateKey) removeShift(cell.dateKey);
                          }}
                          aria-label="削除"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>

      {/* shift patterns */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>
              シフトパターン
            </div>
            <div style={{ fontSize: "12px", color: "#86868b" }}>
              {selLabel
                ? <>「<b style={{ color: "#2bb14d" }}>{selLabel}</b>」に登録するパターンを押してください</>
                : "カレンダーの日付を選んでから、パターンを押してください"}
            </div>
          </div>
          <button
            className="btn btn-sm"
            type="button"
            style={{ background: "#34c759", borderColor: "#34c759", color: "#fff" }}
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "閉じる" : "+ 新規"}
          </button>
        </div>

        {showForm && (
          <div
            style={{
              background: "#fafafa",
              border: "1px solid #e7e7ea",
              borderRadius: "10px",
              padding: "12px",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
              <label style={{ flex: 1, minWidth: "120px", fontSize: "12px", color: "#555" }}>
                パターン名
                <input
                  value={draft.title}
                  placeholder="例：パターンC"
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  style={{ display: "block", width: "100%", marginTop: "4px", border: "1px solid #e7e7ea", borderRadius: "6px", padding: "7px 8px", fontSize: "13px" }}
                />
              </label>
              <label style={{ flex: 1, minWidth: "120px", fontSize: "12px", color: "#555" }}>
                メモ
                <input
                  value={draft.memo}
                  placeholder="例：早番"
                  onChange={(e) => setDraft({ ...draft, memo: e.target.value })}
                  style={{ display: "block", width: "100%", marginTop: "4px", border: "1px solid #e7e7ea", borderRadius: "6px", padding: "7px 8px", fontSize: "13px" }}
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
              <label style={{ flex: 1, minWidth: "100px", fontSize: "12px", color: "#555" }}>
                開始
                <input
                  type="time"
                  value={draft.workStart}
                  onChange={(e) => setDraft({ ...draft, workStart: e.target.value })}
                  style={{ display: "block", width: "100%", marginTop: "4px", border: "1px solid #e7e7ea", borderRadius: "6px", padding: "7px 8px", fontSize: "13px" }}
                />
              </label>
              <label style={{ flex: 1, minWidth: "100px", fontSize: "12px", color: "#555" }}>
                終了
                <input
                  type="time"
                  value={draft.workEnd}
                  onChange={(e) => setDraft({ ...draft, workEnd: e.target.value })}
                  style={{ display: "block", width: "100%", marginTop: "4px", border: "1px solid #e7e7ea", borderRadius: "6px", padding: "7px 8px", fontSize: "13px" }}
                />
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button className="btn btn-sm" type="button" onClick={() => setShowForm(false)}>
                キャンセル
              </button>
              <button className="btn btn-sm btn-dark" type="button" onClick={addPattern}>
                登録
              </button>
            </div>
          </div>
        )}

        <div style={{ fontSize: "13px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 1fr 1.4fr 40px",
              gap: "8px",
              padding: "8px",
              fontSize: "12px",
              color: "#86868b",
              borderBottom: "1px solid #e7e7ea",
            }}
          >
            <span>タイトル</span>
            <span>勤務時間</span>
            <span>メモ</span>
            <span />
          </div>

          {shiftPatterns.length === 0 && (
            <div style={{ padding: "20px 8px", textAlign: "center", color: "#86868b", fontSize: "13px" }}>
              パターンがありません。「+ 新規」から作成してください。
            </div>
          )}

          {shiftPatterns.map((p) => {
            const col = colorFor(p.id);
            return (
              <div
                key={p.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 1fr 1.4fr 40px",
                  gap: "8px",
                  padding: "10px 8px",
                  borderBottom: "1px solid #f1f1f3",
                  borderRadius: "8px",
                  cursor: selectedDate ? "pointer" : "default",
                  transition: "background .1s",
                }}
                onClick={() => registerPattern(p.id)}
                onMouseOver={(e) => { if (selectedDate) (e.currentTarget as HTMLDivElement).style.background = "#f0fbf3"; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLDivElement).style.background = ""; }}
              >
                <span>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: col.bg,
                      color: col.fg,
                    }}
                  >
                    {p.title}
                  </span>
                </span>
                <span style={{ display: "flex", alignItems: "center" }}>
                  {p.workStart}-{p.workEnd}
                </span>
                <span style={{ display: "flex", alignItems: "center", color: "#555" }}>
                  {p.memo || "—"}
                </span>
                <span style={{ textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  <button
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "28px",
                      height: "28px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#fee2e2",
                      cursor: "pointer",
                      padding: 0,
                      transition: "background .15s, transform .1s",
                    }}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePattern(p.id);
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = "#fca5a5"; e.currentTarget.style.transform = "scale(1.12)"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.transform = "scale(1)"; }}
                    aria-label="パターンを削除"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
