import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// 💡 1. 何よりも先に環境変数を読み込む
dotenv.config();

import serverless from 'serverless-http';
import mongoose from 'mongoose'; 
import { connectDatabase } from './src/config/database.js';
import taskRoutes from './src/routes/tasks.js';
import usersRoutes from './src/routes/users.js';
import shiftsRoutes from './src/routes/shifts.js';
import shiftPatternsRoutes from './src/routes/shift-patterns.js';
import businessInfoRoutes from './src/routes/business-info.js';
import staffRoutes from './src/routes/staff.js';
import gachaRoutes from './src/routes/gacha.js';
import gachaSettingsRoutes from './src/routes/gacha-settings.js';
import approvalRoutes from './src/routes/approval.js';
import notificationsRoutes from './src/routes/notifications.js';

const app = express();
const port = 5001;

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// ルートの設定
app.use('/api/tasks', taskRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/shift-patterns', shiftPatternsRoutes);
app.use('/api/business-info', businessInfoRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/gacha', gachaRoutes);
app.use('/api/gacha-settings', gachaSettingsRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/notifications', notificationsRoutes);

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error("====== サーバーエラー発生！！ ======");
  console.error(err.stack);
  console.error("====================================");
  res.status(500).json({ error: err.message });
});

// 定期バッチ関数
const autoRegisterMonthlyTasks = async () => {
  console.log("⏰ 【定期バッチ】月頭の自動タスク登録を開始します...");
  try {
    const Task = mongoose.model('Task');
    const defaultTasks = [
      { task_name: "月頭の全体ミーティング準備", description: "資料の印刷と部屋の確保", xp: 150 },
      { task_name: "定期大掃除（床ワックス掛け）", description: "フロア全体の清掃とワックスがけ作業", xp: 300 },
      { task_name: "在庫棚卸し・発注作業", description: "全商品の在庫数をカウントしてシステムに入力", xp: 200 }
    ];
    await Task.insertMany(defaultTasks);
    console.log("🎉 【定期バッチ】定番タスクの自動登録が正常に完了しました！");
  } catch (error) {
    console.error("❌ 【定期バッチ】登録中にエラーが発生しました:", error.message);
  }
};

let isConnected = false;
const initDatabase = async () => {
  if (isConnected) return;
  try {
    await connectDatabase();
    isConnected = true;
    console.log("MongoDB connection established successfully.");
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error; 
  }
};

// 🚀 2. ローカル開発時はDBを待たずに【1秒で即時起動】させる！
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });

  initDatabase().catch(err => {
    console.warn("⚠️  (裏で接続中...) MongoDBの接続に時間がかかっています:", err.message);
  });
}

// 🔥 【復活！】ここが抜けていたため起動エラー（exited with code 1）が起きていました！
const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  await initDatabase();
  if (event.source === 'aws.events' || event['detail-type'] === 'Scheduled Event') {
    await autoRegisterMonthlyTasks();
    return { status: "success", message: "Monthly batch executed successfully" };
  }
  return await serverlessHandler(event, context);
};