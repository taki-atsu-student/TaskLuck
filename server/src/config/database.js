import mongoose from 'mongoose';

// 💡 1. 接続用の関数（安全な .env 読み込み版）
export const connectDatabase = async () => {
  try {
    const url = process.env.MONGODB_URI;

    if (!url) {
      throw new Error("MONGODB_URI が .env ファイルに設定されていません。");
    }

    await mongoose.connect(url);
    console.log("🟢 [Database] .envの環境変数を使って安全にMongoDBに接続しました！");
  } catch (error) {
    console.error('❌ [Database] MongoDB connection error:', error.message);
    throw error;
  }
};

// 🔥 【復活！】消してしまっていた getDb をここに復元します！
// これがないと、シフトやスタッフの管理機能（コントローラー）が全滅して即死します。
export const getDb = () => {
  if (!mongoose.connection.db) {
    throw new Error("データベースがまだ初期化されていません。");
  }
  return mongoose.connection.db;
};