import { getDb } from '../config/database.js';
import { ObjectId } from 'mongodb';

// 🎯 1. シフト一覧・希望データの取得 (GET /api/shifts)
export const getShifts = async (req, res) => {
  try {
    const db = await getDb();
    // すべてのシフト・申請データを取得
    const rawShifts = await db.collection('shifts').find().toArray();
    
    // フロント（React）の型に合わせてデータを整形して返す
    const shifts = rawShifts.map(s => ({
      id: s._id.toString(),
      uid: Number(s.user_id),       // スタッフID
      date: s.date,                 // 日付 (YYYY-MM-DD)
      s: s.start_time || s.s,       // 開始時間
      e: s.end_time || s.e,         // 終了時間
      st: s.status || s.st,         // 'request' (希望) か 'confirmed' (確定)
      isOff: s.is_off || s.isOff || false, // 休み希望フラグ
      note: s.note || ""            // 備考
    }));

    res.status(200).json(shifts);
  } catch (error) {
    console.error("getShiftsエラー:", error);
    res.status(500).json({ error: "シフトデータの取得に失敗しました" });
  }
};

// 🎯 2. アルバイトからのシフト希望提出 (POST /api/shifts/request)
export const createShiftRequest = async (req, res) => {
  try {
    const { uid, date, s, e, isOff, note } = req.body;
    if (!uid || !date) {
      return res.status(400).json({ error: "ユーザーIDと日付は必須です" });
    }

    const db = await getDb();

    // 💡 同じ人が同じ日にすでに「希望」を出していたら上書き、なければ新規追加
    const shiftData = {
      user_id: Number(uid),
      date: date,
      start_time: s,
      end_time: e,
      status: 'request', // ステータスは「希望」
      is_off: isOff || false,
      note: note || "",
      created_at: new Date()
    };

    // 重複を排除して保存
    await db.collection('shifts').deleteMany({ user_id: Number(uid), date: date, status: 'request' });
    const result = await db.collection('shifts').insertOne(shiftData);

    res.status(201).json({
      id: result.insertedId.toString(),
      uid: Number(uid),
      date,
      s,
      e,
      st: 'request',
      isOff: isOff || false,
      note: note || ""
    });
  } catch (error) {
    console.error("createShiftRequestエラー:", error);
    res.status(500).json({ error: "シフト希望の提出に失敗しました" });
  }
};

// 🎯 3. 店長による確定シフトの作成 (POST /api/shifts/confirm)
export const createConfirmedShift = async (req, res) => {
  try {
    const { uid, date, s, e } = req.body;
    if (!uid || !date || !s || !e) {
      return res.status(400).json({ error: "入力項目を確認してください" });
    }

    const db = await getDb();

    const shiftData = {
      user_id: Number(uid),
      date: date,
      start_time: s,
      end_time: e,
      status: 'confirmed', // ステータスは「確定」
      is_off: false,
      created_at: new Date()
    };

    const result = await db.collection('shifts').insertOne(shiftData);

    // 💡 シフトが確定したら、通知用コレクション(notifications)にもデータを自動でブチ込む！
    const notificationData = {
      title: 'シフトが確定しました',
      sub: `${date} ${s}-${e} のシフトが確定されました`,
      read: false,
      uid: Number(uid),
      timestamp: Date.now()
    };
    await db.collection('notifications').insertOne(notificationData);

    res.status(201).json({
      id: result.insertedId.toString(),
      uid: Number(uid),
      date,
      s,
      e,
      st: 'confirmed',
      isOff: false
    });
  } catch (error) {
    console.error("createConfirmedShiftエラー:", error);
    res.status(500).json({ error: "確定シフトの作成に失敗しました" });
  }
};