import express from 'express';

const router = express.Router();

// シフト初期データ
let shifts = [
  { id: 1, uid: 3, date: '2025-06-09', s: '10:00', e: '17:00', st: 'confirmed' },
  { id: 2, uid: 4, date: '2025-06-09', s: '11:00', e: '18:00', st: 'confirmed' },
  { id: 3, uid: 5, date: '2025-06-09', s: '13:00', e: '20:00', st: 'confirmed' },
  { id: 4, uid: 2, date: '2025-06-10', s: '09:00', e: '17:00', st: 'confirmed' },
  { id: 5, uid: 3, date: '2025-06-11', s: '10:00', e: '17:00', st: 'request' },
  { id: 6, uid: 4, date: '2025-06-14', s: '12:00', e: '19:00', st: 'confirmed' },
  { id: 7, uid: 5, date: '2025-06-16', s: '10:00', e: '16:00', st: 'confirmed' },
];

// GET /api/shifts - シフト一覧取得
router.get('/', (_req, res) => {
  res.json(shifts);
});

// POST /api/shifts - シフト作成（単一）
router.post('/', (req, res) => {
  const { uid, date, s, e, st, isOff } = req.body;

  if (!uid || !date || !s || !e) {
    return res.status(400).json({ error: '必要なデータが不足しています' });
  }

  // 同一ユーザーで同じ日のリクエストがあれば削除（上書き用）
  if (st === 'request') {
    shifts = shifts.filter((sh) => !(sh.uid === uid && sh.date === date && sh.st === 'request'));
  }

  const newShift = {
    id: Date.now() + Math.random(),
    uid: parseInt(uid, 10),
    date,
    s,
    e,
    st: st || 'confirmed',
    isOff: !!isOff,
  };

  shifts.push(newShift);
  res.status(201).json(newShift);
});

// POST /api/shifts/bulk - バルク送信（一括登録）
router.post('/bulk', (req, res) => {
  const { uid, monthPrefix, newEntries } = req.body;

  if (!uid || !monthPrefix || !Array.isArray(newEntries)) {
    return res.status(400).json({ error: '無効なリクエストデータです' });
  }

  const userId = parseInt(uid, 10);

  // 対象月のリクエストシフトを削除
  shifts = shifts.filter((sh) => !(sh.uid === userId && sh.date.startsWith(monthPrefix) && sh.st === 'request'));

  // 新規シフトを登録
  const addedShifts = newEntries.map((entry) => {
    return {
      id: Date.now() + Math.random(),
      uid: userId,
      date: entry.date,
      s: entry.s,
      e: entry.e,
      st: 'request',
      isOff: !!entry.isOff,
    };
  });

  shifts.push(...addedShifts);
  res.json(addedShifts);
});

// PUT /api/shifts/:id - シフトステータス等更新
router.put('/:id', (req, res) => {
  const id = parseFloat(req.params.id);
  const shift = shifts.find((sh) => sh.id === id);

  if (!shift) {
    return res.status(404).json({ error: 'シフトが見つかりません' });
  }

  const { s, e, st, isOff } = req.body;
  if (s !== undefined) shift.s = s;
  if (e !== undefined) shift.e = e;
  if (st !== undefined) shift.st = st;
  if (isOff !== undefined) shift.isOff = isOff;

  res.json(shift);
});

// DELETE /api/shifts/:id - シフト削除
router.delete('/:id', (req, res) => {
  const id = parseFloat(req.params.id);
  const index = shifts.findIndex((sh) => sh.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'シフトが見つかりません' });
  }

  const deleted = shifts.splice(index, 1);
  res.json(deleted[0]);
});

export default router;
