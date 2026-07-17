import { useState } from 'react';
import { BusinessInfo, BusinessDayKey, SpecialBusinessType } from '../models';

type BusinessInfoViewProps = {
  isActive: boolean;
  businessInfo: BusinessInfo;
  updateBusinessInfo: (updater: (prev: BusinessInfo) => BusinessInfo) => void;
  resetBusinessInfo: () => void;
  toast: (message: string) => void;
  onSave: () => Promise<void>;
};

const BUSINESS_DAYS: Array<{ key: BusinessDayKey; label: string; short: string }> = [
  { key: 'mon', label: '月', short: '月' },
  { key: 'tue', label: '火', short: '火' },
  { key: 'wed', label: '水', short: '水' },
  { key: 'thu', label: '木', short: '木' },
  { key: 'fri', label: '金', short: '金' },
  { key: 'sat', label: '土', short: '土' },
  { key: 'sun', label: '日', short: '日' },
  { key: 'holiday', label: '祝', short: '祝' },
];

const SPECIAL_TYPE_LABELS: Record<SpecialBusinessType, string> = {
  closed: '休業日',
  specialClosed: '特別休業',
  shortHours: '営業時間短縮',
};

const StoreIcon = ({ type }: { type: 'users' | 'clock' | 'calendar' | 'edit' | 'trash' | 'save' }) => {
  if (type === 'users') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></svg>;
  if (type === 'clock') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
  if (type === 'calendar') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-5"/></svg>;
  if (type === 'edit') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>;
  if (type === 'trash') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>;
};

export function BusinessInfoView({ isActive, businessInfo, updateBusinessInfo, resetBusinessInfo, toast, onSave }: BusinessInfoViewProps) {
  const [newSpecialDate, setNewSpecialDate] = useState('2024-08-15');

  const updateSlot = (slotId: string, field: 'weekday' | 'holiday', value: number) => {
    updateBusinessInfo((prev) => ({
      ...prev,
      timeSlotStaffing: prev.timeSlotStaffing.map((slot) => slot.id === slotId ? { ...slot, [field]: Math.max(0, value || 0) } : slot),
    }));
  };

  const firstTimeSlots = businessInfo.timeSlotStaffing.filter((slot) => Number(slot.id) < 15);
  const secondTimeSlots = businessInfo.timeSlotStaffing.filter((slot) => Number(slot.id) >= 15);

  const updateClosed = (key: BusinessDayKey, closed: boolean) => {
    updateBusinessInfo((prev) => ({
      ...prev,
      regularClosedDays: closed
        ? Array.from(new Set([...prev.regularClosedDays, key]))
        : prev.regularClosedDays.filter((day) => day !== key),
      hours: { ...prev.hours, [key]: { ...prev.hours[key], closed } },
    }));
  };

  const updateTime = (key: BusinessDayKey, field: 'open' | 'close', value: string) => {
    updateBusinessInfo((prev) => ({
      ...prev,
      hours: { ...prev.hours, [key]: { ...prev.hours[key], [field]: value } },
    }));
  };

  const updateRule = (field: 'requiredBreakMinutes' | 'maxWorkHours' | 'maxConsecutiveWorkDays' | 'minStaff', value: number) => {
    updateBusinessInfo((prev) => ({ ...prev, [field]: Math.max(0, value || 0) }));
  };

  const addSpecialRule = () => {
    updateBusinessInfo((prev) => ({
      ...prev,
      specialRules: [
        ...prev.specialRules,
        { id: Date.now(), date: newSpecialDate, type: 'specialClosed', time: '-', note: '' },
      ],
    }));
    toast('特別設定を追加しました');
  };

  const updateSpecialRule = (id: number, field: 'date' | 'type' | 'time' | 'note', value: string) => {
    updateBusinessInfo((prev) => ({
      ...prev,
      specialRules: prev.specialRules.map((rule) => rule.id === id ? { ...rule, [field]: field === 'type' ? value as SpecialBusinessType : value } : rule),
    }));
  };

  const deleteSpecialRule = (id: number) => {
    updateBusinessInfo((prev) => ({ ...prev, specialRules: prev.specialRules.filter((rule) => rule.id !== id) }));
    toast('特別設定を削除しました');
  };

  const saveSettings = async () => {
    try {
      await onSave();
    } catch {
      toast('店舗設定の保存に失敗しました');
    }
  };

  const cancelSettings = () => {
    resetBusinessInfo();
    toast('店舗設定をキャンセルしました');
  };

  return (
    <div className={`page store-settings-page ${isActive ? 'show' : ''}`} id="pg-business-info">
      <div className="store-toolbar">
        <div className="store-toolbar-left">
          <h1>店舗設定</h1>
        </div>
        <div className="store-toolbar-right">
          <button className="store-btn" type="button" onClick={cancelSettings}>キャンセル</button>
          <button className="store-btn store-btn-green" type="button" onClick={saveSettings}><StoreIcon type="save" />保存</button>
        </div>
      </div>

      <section className="store-panel rules-panel">
        <div className="store-section-head">
          <div className="store-section-icon"><StoreIcon type="clock" /></div>
          <div>
            <h2>勤務ルール設定</h2>
            <p>最大勤務時間・連勤日数・最低人数を設定します。</p>
          </div>
        </div>
        <div className="rules-grid">
          <label>
            <span>最大勤務時間（時間）</span>
            <input type="number" min={0} value={businessInfo.maxWorkHours} onChange={(event) => updateRule('maxWorkHours', Number(event.target.value))} />
          </label>
          <label>
            <span>連勤日数上限（日）</span>
            <input type="number" min={0} value={businessInfo.maxConsecutiveWorkDays} onChange={(event) => updateRule('maxConsecutiveWorkDays', Number(event.target.value))} />
          </label>
          <label>
            <span>最低社員数（人）</span>
            <input type="number" min={0} value={businessInfo.minStaff} onChange={(event) => updateRule('minStaff', Number(event.target.value))} />
          </label>
        </div>
      </section>

      <section className="store-panel min-staff-panel">
        <div className="store-section-head">
          <div className="store-section-icon"><StoreIcon type="users" /></div>
          <div>
            <h2>時間帯最低人数設定</h2>
            <p>各時間帯に必要な最低人数を設定します。</p>
          </div>
        </div>
        <div className="staffing-scroll">
          <div className="staffing-part">
            <table className="staffing-grid">
              <thead>
                <tr>
                  <th></th>
                  {firstTimeSlots.map((slot) => <th key={slot.id}>{slot.label}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>平日</th>
                  {firstTimeSlots.map((slot) => (
                    <td key={`weekday-${slot.id}`}><input type="number" min={0} value={slot.weekday} onChange={(event) => updateSlot(slot.id, 'weekday', Number(event.target.value))} /></td>
                  ))}
                </tr>
                <tr>
                  <th>休日</th>
                  {firstTimeSlots.map((slot) => (
                    <td key={`holiday-${slot.id}`}><input type="number" min={0} value={slot.holiday} onChange={(event) => updateSlot(slot.id, 'holiday', Number(event.target.value))} /></td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="staffing-part">
            <table className="staffing-grid">
              <thead>
                <tr>
                  <th></th>
                  {secondTimeSlots.map((slot) => <th key={slot.id}>{slot.label}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>平日</th>
                  {secondTimeSlots.map((slot) => (
                    <td key={`weekday-${slot.id}`}><input type="number" min={0} value={slot.weekday} onChange={(event) => updateSlot(slot.id, 'weekday', Number(event.target.value))} /></td>
                  ))}
                </tr>
                <tr>
                  <th>休日</th>
                  {secondTimeSlots.map((slot) => (
                    <td key={`holiday-${slot.id}`}><input type="number" min={0} value={slot.holiday} onChange={(event) => updateSlot(slot.id, 'holiday', Number(event.target.value))} /></td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="min-staff-save"><button className="store-btn store-btn-green" type="button" onClick={saveSettings}>保存</button></div>
      </section>

      <div className="store-two-col">
        <section className="store-panel hours-panel">
          <div className="store-section-head">
            <div className="store-section-icon"><StoreIcon type="clock" /></div>
            <div>
              <h2>営業時間・定休日設定（基本的なスケジュール）</h2>
              <p>曜日ごとの基本営業時間を設定します。</p>
            </div>
          </div>
          <div className="weekday-editor">
            <div className="weekday-label-spacer">
              <div className="hours-row-label open-label">基本営業時間</div>
              <div className="hours-row-label close-label">基本終業時間</div>
            </div>
            {BUSINESS_DAYS.map((day) => {
              const hours = businessInfo.hours[day.key];
              return (
                <div className={`weekday-card ${hours.closed ? 'is-closed' : ''}`} key={day.key}>
                  <div className="weekday-title">{day.label}</div>
                  <label className="store-switch">
                    <input type="checkbox" checked={!hours.closed} onChange={(event) => updateClosed(day.key, !event.target.checked)} />
                    <span />
                  </label>
                  <input type="text" value={hours.open} disabled={hours.closed} onChange={(event) => updateTime(day.key, 'open', event.target.value)} />
                  <input type="text" value={hours.close} disabled={hours.closed} onChange={(event) => updateTime(day.key, 'close', event.target.value)} />
                </div>
              );
            })}
          </div>
        </section>

        <section className="store-panel special-panel">
          <div className="store-section-head special-head">
            <div className="store-section-icon"><StoreIcon type="calendar" /></div>
            <div>
              <h2>特別営業日・休業日</h2>
              <p>特定の日の営業変更や臨時休業を設定します。</p>
            </div>
          </div>
          <div className="special-add-row">
            <input type="date" value={newSpecialDate} onChange={(event) => setNewSpecialDate(event.target.value)} />
            <button className="store-btn store-btn-green" type="button" onClick={addSpecialRule}>特別設定を追加</button>
          </div>
          <div className="special-table">
            <div className="special-table-head"><span>日</span><span>種類</span><span>時間</span><span>備考</span><span></span></div>
            {businessInfo.specialRules.map((rule) => (
              <div className="special-row" key={rule.id}>
                <input type="date" value={rule.date} onChange={(event) => updateSpecialRule(rule.id, 'date', event.target.value)} />
                <select value={rule.type} onChange={(event) => updateSpecialRule(rule.id, 'type', event.target.value)}>
                  <option value="closed">{SPECIAL_TYPE_LABELS.closed}</option>
                  <option value="specialClosed">{SPECIAL_TYPE_LABELS.specialClosed}</option>
                  <option value="shortHours">{SPECIAL_TYPE_LABELS.shortHours}</option>
                </select>
                <input type="text" value={rule.time} onChange={(event) => updateSpecialRule(rule.id, 'time', event.target.value)} placeholder="例: 10:00-17:00" />
                <input type="text" value={rule.note} onChange={(event) => updateSpecialRule(rule.id, 'note', event.target.value)} placeholder="例: 盆休み" />
                <div className="special-actions">
                  <button type="button" aria-label="編集"><StoreIcon type="edit" /></button>
                  <button type="button" aria-label="削除" onClick={() => deleteSpecialRule(rule.id)}><StoreIcon type="trash" /></button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
