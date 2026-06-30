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
  if (!mongoose.connection.db) {
    throw new Error("データベースがまだ初期化されていません。");
  }
  return mongoose.connection.db;
};