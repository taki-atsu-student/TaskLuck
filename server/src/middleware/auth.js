import { CognitoJwtVerifier } from 'aws-jwt-verify';
import mongoose from 'mongoose';

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
    const user = await db.collection('users').findOne({ 
      $or: [
        { username: payload.username },
        { email: payload.email }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'ユーザーがDBに見つかりません' });
    }

    // リクエストオブジェクトにユーザー情報を格納して次に回す
    req.user = user;
    next();
  } catch (error) {
    console.error('認証エラー:', error);
    return res.status(401).json({ error: 'トークンが無効です' });
  }
};