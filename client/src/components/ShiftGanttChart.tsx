import { Shift, ShiftAssignment, User } from '../models';

export const START_MIN = 6 * 60;
export const END_MIN = 24 * 60;
export const TOTAL_MIN = END_MIN - START_MIN;
export const STEP_MIN = 15;
export const GANTT_COLORS = ['gantt-blue', 'gantt-green', 'gantt-orange', 'gantt-purple', 'gantt-red'];

export const toMin = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const toTime = (min: number) => {
  const safe = Math.max(0, Math.min(24 * 60, min));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const roundStep = (min: number) => Math.round(min / STEP_MIN) * STEP_MIN;

export type GanttRow = { user: User; shifts: Shift[] };

type ShiftGanttChartProps = {
  activeTab: ShiftAssignment;
  onTabChange: (tab: ShiftAssignment) => void;
  rowShifts: GanttRow[];
  emptyMessage: string;
  readOnly?: boolean;
  onBarMouseDown?: (event: React.MouseEvent<HTMLDivElement>, shift: Shift, mode: 'move' | 'start' | 'end') => void;
};

export function ShiftGanttChart({ activeTab, onTabChange, rowShifts, emptyMessage, readOnly, onBarMouseDown }: ShiftGanttChartProps) {
  const isEmpty = rowShifts.every((row) => row.shifts.length === 0);
  return (
    <>
      <div className="gantt-tabs">
        <button className={`gantt-tab${activeTab === 'hall' ? ' active' : ''}`} type="button" onClick={() => onTabChange('hall')}>ホール</button>
        <button className={`gantt-tab${activeTab === 'kitchen' ? ' active' : ''}`} type="button" onClick={() => onTabChange('kitchen')}>キッチン</button>
      </div>
      <div className="gantt-wrap">
        <div className="gantt-scale">
          <div className="gantt-staff-space" />
          <div className="gantt-time-grid">
            {[6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map((hour) => <span key={hour}>{hour}:00</span>)}
          </div>
        </div>
        {rowShifts.map(({ user, shifts: userShifts }, rowIndex) => (
          <div className="gantt-row" key={user.id}>
            <div className="gantt-staff">
              <div className="sb-avatar">{user.ini ?? '?'}</div>
              <div>
                <div className="gantt-name">{user.name ?? '未設定'}</div>
                <div className="gantt-role">{activeTab === 'hall' ? 'ホール' : 'キッチン'}</div>
              </div>
            </div>
            <div className="gantt-track">
              {userShifts.map((shift, shiftIndex) => {
                const sMin = Math.max(START_MIN, toMin(shift.s));
                const eMin = Math.min(END_MIN, toMin(shift.e));
                const left = ((sMin - START_MIN) / TOTAL_MIN) * 100;
                const width = ((eMin - sMin) / TOTAL_MIN) * 100;
                return (
                  <div
                    className={`gantt-bar ${GANTT_COLORS[(rowIndex + shiftIndex) % GANTT_COLORS.length]}${readOnly ? ' readonly' : ''}`}
                    key={shift.id}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onMouseDown={readOnly ? undefined : (event) => onBarMouseDown?.(event, shift, 'move')}
                  >
                    {!readOnly ? <div className="gantt-handle left" onMouseDown={(event) => onBarMouseDown?.(event, shift, 'start')} /> : null}
                    <span>{shift.s}-{shift.e}</span>
                    {!readOnly ? <div className="gantt-handle right" onMouseDown={(event) => onBarMouseDown?.(event, shift, 'end')} /> : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {isEmpty ? <div className="empty-gantt">{emptyMessage}</div> : null}
      </div>
    </>
  );
}
