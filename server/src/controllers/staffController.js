import { getDb } from '../config/database.js';
// 💡 AWS SDKをインポート（後で npm install します）
import { CognitoIdentityProviderClient, AdminCreateUserCommand } from "@aws-sdk/client-cognito-identity-provider";

// Cognitoのクライアント初期化（東京リージョン）
const cognitoClient = new CognitoIdentityProviderClient({ region: "ap-northeast-1" });

// 🎯 1. スタッフ一覧取得 (GET /api/staff)
export const getStaffList = async (req, res) => {
  try {
    const db = getDb();
    const rawUsers = await db.collection('users').find().toArray();
    
    // フロント（React）の型に合わせてデータを整形して返す
    const users = rawUsers.map(u => ({
      id: Number(u.user_id), // フロントの型に合わせて数値化
      username: u.username || `user${u.user_id}`, // 💡 ログイン用のユーザー名を追加
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

// 🎯 2. スタッフ（アルバイト）の新規登録 (MongoDB + Cognito 連動版)
export const createStaff = async (req, res) => {
  try {
    const { name, role, salary } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "名前を入力してください" });
    }

    const db = getDb();

    // 現在の最大user_idを取得して、+1 した新しいIDを発行する
    const lastUser = await db.collection('users').find().sort({ user_id: -1 }).limit(1).toArray();
    const newId = lastUser.length > 0 ? Number(lastUser[0].user_id) + 1 : 1;
    
    const username = `user${newId}`; // 💡 ログイン用ユーザー名 (例: user1, user2)
    const password = `pass${String(newId).padStart(4, '0')}`; // 💡 ポリシー適合の初期パス (例: pass0001)

    // ----------------------------------------------------
    // 🔐 【AWS連携】裏でCognitoにユーザーを自動作成する
    // ----------------------------------------------------
    try {
      // .envファイルにプールIDが設定されている場合のみCognitoへリクエストを飛ばす
      if (process.env.COGNITO_USER_POOL_ID) {
        const cognitoParams = {
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: username,
          TemporaryPassword: password, // 初期パスワード
          UserAttributes: [
            { Name: "custom:role", Value: role || "part" } // 店長かバイトかの権限を刻む
          ],
          MessageAction: "SUPPRESS" // アルバイトへの確認メール送信をスキップ
        };
        
        await cognitoClient.send(new AdminCreateUserCommand(cognitoParams));
        console.log(`🎉 Amazon Cognitoにユーザーを追加しました: ${username}`);
      }
    } catch (cognitoError) {
      // 💡 お家テスト時など、Cognitoの設定がない・繋がらない時でもエラーで落ちずにログだけ残してDB保存に進むセーフティネット
      console.warn("⚠️ Cognitoへの登録をスキップ、または失敗しました:", cognitoError.message);
    }
    // ----------------------------------------------------

    const userData = {
      user_id: newId,
      username: username, // 💡 ログイン用IDをDBにも保持
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
      username: username, // 💡 画面側に返すデータにも追加
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

    // 対象ユーザーの累計XP（xp）をインクリメント（加算）する
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