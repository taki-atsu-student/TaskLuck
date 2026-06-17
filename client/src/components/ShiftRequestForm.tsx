import { useState } from 'react';
import type { ShiftRequestErrors, ShiftRequestPayload } from '../types/shift';

type Props = {
  userId: number;
  onSubmit: (payload: ShiftRequestPayload) => Promise<void> | void;
};

export default function ShiftRequestForm({ userId, onSubmit }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<ShiftRequestErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: ShiftRequestErrors = {};

    if (!date) nextErrors.date = '日付を入力してください';
    if (!startTime) nextErrors.startTime = '開始時間を入力してください';
    if (!endTime) nextErrors.endTime = '終了時間を入力してください';
    if (startTime && endTime && startTime >= endTime) {
      nextErrors.endTime = '終了時間は開始時間より後にしてください';
    }
    if (note.length > 120) nextErrors.note = '備考は120文字以内で入力してください';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    await onSubmit({ userId, date, startTime, endTime, note });
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">シフト希望を提出</h2>
        <p className="text-sm text-slate-500">日付と時間を入力して、希望シフトを店長に送信します。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-700">
          <span>日付</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />
          {errors.date && <p className="text-xs text-rose-500">{errors.date}</p>}
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          <span>開始時間</span>
          <input
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />
          {errors.startTime && <p className="text-xs text-rose-500">{errors.startTime}</p>}
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          <span>終了時間</span>
          <input
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />
          {errors.endTime && <p className="text-xs text-rose-500">{errors.endTime}</p>}
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          <span>備考（任意）</span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="例：早番、研修対応希望"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
          />
          {errors.note && <p className="text-xs text-rose-500">{errors.note}</p>}
        </label>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-sm text-slate-500">入力内容の確認</div>
        <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <div>日付: <span className="font-medium">{date}</span></div>
          <div>時間: <span className="font-medium">{startTime} 〜 {endTime}</span></div>
          <div className="md:col-span-2">備考: <span className="font-medium">{note || 'なし'}</span></div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
          onClick={() => {
            setDate(new Date().toISOString().slice(0, 10));
            setStartTime('09:00');
            setEndTime('17:00');
            setNote('');
            setErrors({});
          }}
        >
          リセット
        </button>
        <button
          type="button"
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? '送信中...' : '希望を提出'}
        </button>
      </div>
    </div>
  );
}
