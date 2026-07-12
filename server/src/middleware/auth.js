import { CognitoJwtVerifier } from 'aws-jwt-verify';
import mongoose from 'mongoose';
import { getDb } from '../config/database.js'; // 🟢 getDbのインポートを追加

// Cognitoの検証設定（.env から読み込み）
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
});

export const checkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '認証トークンがありません' });
    }

    const token = authHeader.split(' ')[1];
    // トークンの妥当性を検証
    const payload = await verifier.verify(token);

    // Cognitoの username や email を使って、完全版の users テーブルから検索
    const db = await getDb();
    let user = await db.collection('users').findOne({ 
      $or: [
        { username: payload.username },
        { email: payload.email }
      ]
    });

    // 🟢【ここが安定化の切り札！】もしCognito側で認証されたのにDBにデータがなければ、その場で自動修復・作成する！
    if (!user) {
      console.log(`⚠️ Cognitoユーザー [${payload.username}] がDBに存在しないため、自動同期します...`);
      
      const allUsers = await db.collection('users').find().toArray();
      // 重複しない新しい連番IDを計算
      const newId = allUsers.length > 0 ? Math.max(...allUsers.map((u) => u.id || 0)) + 1 : 1;
      
      const newUser = {
        id: newId,
        username: payload.username,
        email: payload.email || `${payload.username}@example.com`,
        name: payload.username, // 仮の名前としてusernameを設定
        role: 'STAFF',         // デフォルト権限
        xp: 0,
        ini: payload.username.charAt(0).toUpperCase() || 'S',
        created_at: new Date()
      };
      
      // DBにデータを書き込む
      await db.collection('users').insertOne(newUser);
      user = newUser; // 作成したユーザーデータを代入して、そのままログインを続行させる！
      console.log(`🟢 ユーザー [${payload.username}] のDB自動同期が完了しました。`);
    }

    // リクエストオブジェクトにユーザー情報を格納して次に回す
    req.user = user;
    next();
  } catch (error) {
    console.error('認証エラー:', error);
    return res.status(401).json({ error: 'トークンが無効です' });
  }
};