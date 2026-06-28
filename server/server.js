import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import serverless from 'serverless-http'; // 💡 追加
import { connectDatabase } from './src/config/database.js';
import taskRoutes from './src/routes/tasks.js';
import shiftRoutes from './src/routes/shifts.js';
import staffRoutes from './src/routes/staff.js';
import businessRoutes from './src/routes/business.js';

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

// 💡 データベース接続を管理する関数（Lambdaで接続を使い回すための工夫）
let isConnected = false;
const initDatabase = async () => {
  if (isConnected) return;
  try {
    await connectDatabase();
    isConnected = true;
  } catch (error) {
    console.warn('MongoDB connection was not established:', error.message);
  }
};

// 💡 ローカルPC（開発環境）の時は、今まで通り起動する
if (process.env.NODE_ENV !== 'production') {
  initDatabase().then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  });
}

// 💡 AWS Lambda（本番環境）用のエクスポート設定
export const handler = serverless(app, {
  request: async (request) => {
    await initDatabase(); // 💡 通信が届いた瞬間にDB接続を確認・確立する
  }
});