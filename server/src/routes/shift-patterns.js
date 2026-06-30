import express from 'express';

const router = express.Router();

// デフォルトのパターン
const DEFAULT_PATTERNS = [
  { id: 1, title: 'パターンA', workStart: '17:00', workEnd: '21:00', breakTime: 0, memo: '平日用' },
  { id: 2, title: 'パターンB', workStart: '13:00', workEnd: '21:00', breakTime: 60, memo: '休日用' },
];

// ユーザーごとのシフトパターンマップ
let shiftPatternsMap = {};

// GET /api/shift-patterns - ユーザーのシフトパターン取得
router.get('/', (req, res) => {
  const uid = req.query.uid ? parseInt(req.query.uid, 10) : null;

  if (uid === null) {
    // uid指定がない場合はマップ全体を返却
    return res.json(shiftPatternsMap);
  }

  const userPatterns = shiftPatternsMap[uid] || DEFAULT_PATTERNS;
  res.json(userPatterns);
});

// POST /api/shift-patterns - シフトパターンの更新・追加 (特定のユーザー用)
router.post('/', (req, res) => {
  const { uid, patterns } = req.body;

  if (!uid || !Array.isArray(patterns)) {
    return res.status(400).json({ error: 'ユーザーIDとパターン配列は必須です' });
  }

  const userId = parseInt(uid, 10);
  shiftPatternsMap[userId] = patterns;

  res.json({ success: true, patterns: shiftPatternsMap[userId] });
});

export default router;
