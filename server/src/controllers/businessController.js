import { getDb } from '../config/database.js';

// 🎯 1. 店舗情報の取得 (GET /api/business-info)
export const getBusinessInfo = async (req, res) => {
  try {
    const db = await getDb();
    // コレクションから最初の1件を取得
    let info = await db.collection('business_info').findOne({});
    
    // もしDBにまだ何も無ければ、フロントの初期データと同じ形のデフォルト値を返す
    if (!info) {
      info = {
        storeName: "TaskLuck店舗",
        minStaffPerShift: 2,
        targetXpPerMonth: 1000,
        positions: ["レジ", "キッチン", "ホール", "清掃"]
      };
    } else {
      // MongoDBの自動ID（_id）を消して綺麗にして返す
      delete info._id;
    }

    res.status(200).json(info);
  } catch (error) {
    console.error("getBusinessInfoエラー:", error);
    res.status(500).json({ error: "店舗情報の取得に失敗しました" });
  }
};

// 🎯 2. 店舗情報の更新・保存 (POST /api/business-info)
export const updateBusinessInfo = async (req, res) => {
  try {
    const { storeName, minStaffPerShift, targetXpPerMonth, positions } = req.body;
    const db = await getDb();

    const newInfo = {
      storeName: storeName || "TaskLuck店舗",
      minStaffPerShift: Number(minStaffPerShift) || 2,
      targetXpPerMonth: Number(targetXpPerMonth) || 1000,
      positions: positions || ["レジ", "キッチン", "ホール", "清掃"],
      updated_at: new Date()
    };

    // 💡 DBにデータが「あれば更新」「なければ新規作成（upsert）」する
    await db.collection('business_info').replaceOne({}, newInfo, { upsert: true });

    res.status(200).json({ success: true, message: "店舗設定を保存しました", data: newInfo });
  } catch (error) {
    console.error("updateBusinessInfoエラー:", error);
    res.status(500).json({ error: "店舗情報の保存に失敗しました" });
  }
};