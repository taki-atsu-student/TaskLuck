import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import serverless from 'serverless-http';
import mongoose from 'mongoose'; // 💡 モデル操作のために追加
import { connectDatabase } from './src/config/database.js';
import taskRoutes from './src/routes/tasks.js';
import shiftRoutes from './src/routes/shifts.js';
import staffRoutes from './src/routes/staff.js';
import businessRoutes from './src/routes/business.js';

import './src/models/User.js';
import './src/models/Task.js';
import './src/models/TaskAssignment.js';
import './src/models/Notification.js';
import './src/models/Staff.js';
import './src/models/ShiftPattern.js';
import './src/models/ShiftRequest.js';
import './src/models/BusinessRule.js';

dotenv.config();

const app = express();
const port = 5001;

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// ルートの設定
app.use('/api/tasks', taskRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/business-info', businessRoutes);

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error("====== サーバーエラー発生！！ ======");
  console.error(err.stack);
  console.error("====================================");
  res.status(500).json({ error: err.message });
});

// 💡 毎月1日に自動で動かすタスク一括登録関数（中身を作成！）
const autoRegisterMonthlyTasks = async () => {
  console.log("⏰ 【定期バッチ】月頭の自動タスク登録を開始します...");
  try {
    const Task = mongoose.model('Task');

    // 毎月自動登録したい定番タスクのリスト（学校のテスト用に分かりやすい内容）
    const defaultTasks = [
      { task_name: "月頭の全体ミーティング準備", description: "資料の印刷と部屋の確保", xp: 150 },
      { task_name: "定期大掃除（床ワックス掛け）", description: "フロア全体の清掃とワックスがけ作業", xp: 300 },
      { task_name: "在庫棚卸し・発注作業", description: "全商品の在庫数をカウントしてシステムに入力", xp: 200 }
    ];

    // DBにドバッと一括登録（insertMany）
    // 💡 uniqueをかけていないので、毎月同じ名前で何回登録されても絶対にエラーになりません！
    await Task.insertMany(defaultTasks);
    console.log("🎉 【定期バッチ】定番タスクの自動登録が正常に完了しました！");
  } catch (error) {
    console.error("❌ 【定期バッチ】登録中にエラーが発生しました:", error.message);
  }
};

// ==========================================================
// 💡 修正部分：DB接続を完全に同期させてからポートを開く安全起動
// ==========================================================
let isConnected = false;
const initDatabase = async () => {
  if (isConnected) return;
  try {
    // connectDatabaseの完了をガチで待つ
    await connectDatabase();
    isConnected = true;
    console.log("MongoDB connection established successfully.");
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    // エラーを上に投げることで、繋がっていないのにlistenするのを防ぐ
    throw error; 
  }
};

// ローカルPC（開発環境）の起動処理
if (process.env.NODE_ENV !== 'production') {
  console.log("=> データベースに接続を開始します...");
  
  // 先にDB接続を実行し、成功した場合のみlistenする
  initDatabase()
    .then(() => {
      app.listen(port, () => {
        console.log(`🚀 DB接続完了！Server is running on http://localhost:${port}`);
      });
    })
    .catch((err) => {
      console.error("🚨 【致命的】DB接続に失敗したため、サーバーの起動を停止しました。");
    });
}

// 💡 AWS Lambda用のハンドラー
// serverless-http で包む前の、生のLambda関数（ handler ）を自作して分岐させます
const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  // 1. まず絶対にDBに接続する
  await initDatabase();

  // 2. もしEventBridge（タイマー）からの定期実行イベントだったら
  // AWSのEventBridgeから来るときは、event.source が "aws.events" になります
  if (event.source === 'aws.events' || event['detail-type'] === 'Scheduled Event') {
    await autoRegisterMonthlyTasks();
    return { status: "success", message: "Monthly batch executed successfully" };
  }

  // 3. 普段の画面（API Gateway）からのアクセスなら、Expressに処理を丸投げする
  return await serverlessHandler(event, context);
};