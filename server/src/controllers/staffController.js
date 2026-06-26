import { getDb } from '../config/database.js';

// 🎯 1. スタッフ一覧取得 (GET /api/staff)
export const getStaffList = async (req, res) => {
  try {
    const db = getDb();
    const rawUsers = await db.collection('users').find().toArray();
    
    // フロント（React）の型に合わせてデータを整形して返す
    const users = rawUsers.map(u => ({
      id: Number(u.user_id), // フロントの型に合わせて数値化
      name: u.name || "",
      role: u.role || "part", // 'manager' か 'part' か 'staff'
      xp: parseInt(u.xp, 10) || 0, // 累計XP
      ini: u.ini || (u.name ? u.name.charAt(0) : "S"),
      password: u.password || ""
    }));

    res.status(200).json(users);
  } catch (error) {
    console.error("getStaffListエラー:", error);
    res.status(500).json({ error: "スタッフ一覧の取得に失敗しました" });
  }
};

// 🎯 2. スタッフ（アルバイト）の新規登録 (POST /api/staff)
export const createStaff = async (req, res) => {
  try {
    const { name, role, salary } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "名前を入力してください" });
    }

    const db = getDb();

    // 💡 現在の最大user_idを取得して、+1 した新しいIDを発行する
    const lastUser = await db.collection('users').find().sort({ user_id: -1 }).limit(1).toArray();
    const newId = lastUser.length > 0 ? Number(lastUser[0].user_id) + 1 : 1;
    const password = `pass${String(newId).padStart(4, '0')}`; // pass0001 のような初期パスワード

    const userData = {
      user_id: newId,
      name: name.trim(),
      role: role || 'part',
      xp: 0,
      ini: name.trim().charAt(0) || 'S',
      password: password,
      created_at: new Date(),
      // ロールに合わせて給与フィールドを分ける（詳細設計に準拠）
      ...(role === 'part' ? { hourly_wage: Number(salary) || 1050 } : { monthly_salary: Number(salary) || 200000 })
    };

    await db.collection('users').insertOne(userData);

    res.status(201).json({
      id: newId,
      name: userData.name,
      role: userData.role,
      xp: 0,
      ini: userData.ini,
      password: userData.password
    });
  } catch (error) {
    console.error("createStaffエラー:", error);
    res.status(500).json({ error: "スタッフの追加に失敗しました" });
  }
};

// 🎯 3. タスク承認時のXP加算処理 (POST /api/staff/add-xp)
export const addStaffXp = async (req, res) => {
  try {
    const { userId, xp } = req.body;
    if (!userId || xp === undefined) {
      return res.status(400).json({ error: "ユーザーIDとXPは必須です" });
    }

    const db = getDb();

    // 💡 対象ユーザーの累計XP（xp）をインクリメント（加算）する
    const result = await db.collection('users').updateOne(
      { user_id: Number(userId) },
      { $inc: { xp: Number(xp) } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "対象のユーザーが見つかりません" });
    }

    res.status(200).json({ success: true, message: `+${xp} XP を付与しました` });
  } catch (error) {
    console.error("addStaffXpエラー:", error);
    res.status(500).json({ error: "XPの付与に失敗しました" });
  }
};