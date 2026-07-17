import mongoose from 'mongoose';
import { logError } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI が環境変数に設定されていません！');
  process.exit(1);
}

// サーバー起動時に呼ばれる「接続開始」の関数
export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  try {
    // 🟢 1. 接続開始のログを出す（入力側の良いところ）
    console.log('🔄 MongoDBへの新規接続を開始します...');
 
    // 🟢 2. 安全なオプション付きで接続する（入力側の超重要な良いところ）
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
 
    // 🟢 3. 接続成功ログを出す（入力側の良いところ）
    console.log('🟢 [Database] 安全にMongoDBに接続しました！');
  } catch (error) {
    // 🟢 4. エラー時は、HEADの優秀なロガーを使ってしっかり保存する！（現在側の良いところ）
    logError('❌ [Database] MongoDB connection error:', error.message || error);
    throw error;
  }
};

// 各ルートから呼ばれる「確実な db 取得」関数
export const getDb = async () => {
  let attempts = 0;
  
  // 100% 接続が完了（readyState === 1）するまでガチでループ待機する
  while (mongoose.connection.readyState !== 1 && attempts < 50) {
    console.log(`⏳ [Database] 接続完了を待っています... (${attempts + 1}/50)`);
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  // 🟢【ここを修正！】Mongooseの偽物dbを無視して、本物のMongoClientからdbを直接生成して返す（超確実）
  if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.client) {
    return mongoose.connection.client.db();
  }

  // セーフティネット
  if (mongoose.connection && mongoose.connection.db) {
    return mongoose.connection.db;
  }
  
  throw new Error('❌ [Database] タイムアウト: MongoDBとの接続が完了しませんでした。');
};