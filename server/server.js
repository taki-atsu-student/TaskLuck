import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import serverless from 'serverless-http';
import mongoose from 'mongoose'; 

dotenv.config();

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

app.use((err, req, res, next) => {
  console.error("====== サーバーエラー発生！！ ======");
  console.error(err.stack);
  console.error("====================================");
  res.status(500).json({ error: err.message });
});

const autoRegisterMonthlyTasks = async () => {
  try {
    const Task = mongoose.model('Task');
    const defaultTasks = [
      { task_name: "月頭の全体ミーティング準備", description: "資料の印刷と部屋の確保", xp: 150 },
      { task_name: "定期大掃除（床ワックス掛け）", description: "フロア全体の清掃とワックスがけ作業", xp: 300 },
      { task_name: "在庫棚卸し・発注作業", description: "全商品の在庫数をカウントしてシステムに入力", xp: 200 }
    ];
    await Task.insertMany(defaultTasks);
  } catch (error) {
    console.error("❌ 【定期バッチ】エラー:", error.message);
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

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`http://localhost:${port}`);
  });

  initDatabase().catch(err => {
    console.warn("⚠️ MongoDB接続待機中:", err.message);
  });
}

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  await initDatabase();
  if (event.source === 'aws.events' || event['detail-type'] === 'Scheduled Event') {
    await autoRegisterMonthlyTasks();
    return { status: "success", message: "Monthly batch executed successfully" };
  }
  return await serverlessHandler(event, context);
};