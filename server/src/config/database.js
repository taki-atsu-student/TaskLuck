import mongoose from 'mongoose';

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

export const getDb = () => {
  // connection.client が存在するかチェック
  if (!mongoose.connection.client) {
    throw new Error("データベースがまだ初期化されていません。");
  }
  // client.db() から安全に生のDBオブジェクトを取得する
  return mongoose.connection.client.db();
};