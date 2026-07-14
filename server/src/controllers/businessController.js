import { getDb } from '../config/database.js';
import { logError } from '../utils/logger.js';

// 🎯 1. 店舗情報の取得 (GET /api/business-info)
export const getBusinessInfo = async (req, res) => {
  try {
    const db = getDb();
    // コレクションから最初の1件を取得
    const info = await db.collection('business_info').findOne({});

    if (!info) {
      return res.status(404).json({ error: '店舗情報がまだ登録されていません' });
    }

    delete info._id;
    res.status(200).json(info);
  } catch (error) {
    logError("getBusinessInfoエラー:", error);
    res.status(500).json({ error: "店舗情報の取得に失敗しました" });
  }
};

// 🎯 2. 店舗情報の更新・保存 (POST /api/business-info)
export const updateBusinessInfo = async (req, res) => {
  try {
    const { storeName, minStaffPerShift, targetXpPerMonth, positions } = req.body;
    const db = getDb();

    const newInfo = {
      storeName: storeName ?? '',
      minStaffPerShift: Number.isFinite(Number(minStaffPerShift)) ? Number(minStaffPerShift) : 0,
      targetXpPerMonth: Number.isFinite(Number(targetXpPerMonth)) ? Number(targetXpPerMonth) : 0,
      positions: Array.isArray(positions) ? positions : [],
      updated_at: new Date()
    };

    // 💡 DBにデータが「あれば更新」「なければ新規作成（upsert）」する
    await db.collection('business_info').replaceOne({}, newInfo, { upsert: true });

    res.status(200).json({ success: true, message: "店舗設定を保存しました", data: newInfo });
  } catch (error) {
    logError("updateBusinessInfoエラー:", error);
    res.status(500).json({ error: "店舗情報の保存に失敗しました" });
  }
};