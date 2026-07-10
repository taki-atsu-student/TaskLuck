import { getDb } from '../config/database.js';
import { CognitoIdentityProviderClient, AdminCreateUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({ region: "ap-northeast-1" });

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'manager' || value === 'staff' || value === 'part') return value;
  if (value === 'admin') return 'manager';
  return 'staff';
};

const toDbRole = (role) => {
  const value = normalizeRole(role);
  if (value === 'manager') return 'MANAGER';
  return 'STAFF';
};

// 🎯 1. スタッフ一覧取得 (GET /api/staff)
export const getStaffList = async (req, res) => {
  try {
    const db = await getDb();
    const rawUsers = await db.collection('users').find().toArray();
    
    // 完全版のDB構造 (id, current_xp) をフロントの期待する型に整えて返す
    const users = rawUsers.map(u => ({
      id: Number(u.id), 
      username: u.username || `user${u.id}`, 
      name: u.name || "",
      role: normalizeRole(u.role),
      xp: parseInt(u.current_xp, 10) || 0, // 完全版のフィールド「current_xp」に合わせる
      ini: u.ini || (u.name ? u.name.charAt(0) : "S"),
      password: u.password || ""
    }));

    res.status(200).json(users);
  } catch (error) {
    console.error("getStaffListエラー:", error);
    res.status(500).json({ error: "スタッフ一覧の取得に失敗しました" });
  }
};

// 🎯 2. スタッフの新規登録 (MongoDB + Cognito 連動版)
export const createStaff = async (req, res) => {
  try {
    const { name, role, salary } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "名前を入力してください" });
    }

    const db = await getDb();

    // 現在の最大 id を取得して +1（完全版のフィールド「id」に合わせる）
    const lastUser = await db.collection('users').find().sort({ id: -1 }).limit(1).toArray();
    const newId = lastUser.length > 0 ? Number(lastUser[0].id) + 1 : 1;
    
    const username = `user${newId}`; 
    const password = `pass${String(newId).padStart(4, '0')}`; 

    // 🔐 Cognito連動
    try {
      if (process.env.COGNITO_USER_POOL_ID) {
        const cognitoParams = {
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: username,
          TemporaryPassword: password,
          UserAttributes: [
            { Name: "custom:role", Value: normalizeRole(role) }
          ],
          MessageAction: "SUPPRESS"
        };
        
        await cognitoClient.send(new AdminCreateUserCommand(cognitoParams));
        console.log(`🎉 Amazon Cognitoにユーザーを追加しました: ${username}`);
      }
    } catch (cognitoError) {
      console.warn("⚠️ Cognitoへの登録をスキップ、または失敗しました:", cognitoError.message);
    }

    // 完全版 users テーブルのデータ構造に完全準拠させる
    const userData = {
      id: newId,
      username: username,
      name: name.trim(),
      email: `${role || 'part'}_${newId}@example.com`,
      password: password,
      role: toDbRole(role), // DB側は大文字統一
      level: 1,
      current_xp: 0,
      next_level_xp: 100,
      ini: name.trim().charAt(0) || 'S',
      created_at: new Date(),
      // 役職に応じた給与フィールドの割り振り
      hourlyWage: role === 'part' ? (Number(salary) || 1050) : 0,
      monthlySalary: role !== 'part' ? (Number(salary) || 250010) : 0
    };

    await db.collection('users').insertOne(userData);

    // フロント側に返すオブジェクト（フロント側の型定義に丸める）
    res.status(201).json({
      id: newId,
      username: username,
      name: userData.name,
      role: normalizeRole(role),
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

    const db = await getDb();

    // 完全版のフィールド「id」と「current_xp」に対して加算を行う
    const result = await db.collection('users').updateOne(
      { id: Number(userId) },
      { $inc: { current_xp: Number(xp) } }
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