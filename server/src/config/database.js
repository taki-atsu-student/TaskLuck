import mongoose from 'mongoose';
import { logError } from '../utils/logger.js';

export const connectDatabase = async () => {
  try {
    const url = process.env.MONGODB_URI;
    if (!url) {
      throw new Error("MONGODB_URI が .env ファイルに設定されていません。");
    }
    await mongoose.connect(url);
  } catch (error) {
    logError('❌ [Database] MongoDB connection error:', error.message);
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