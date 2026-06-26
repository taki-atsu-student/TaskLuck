import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDatabase } from './src/config/database.js';
import taskRoutes from './src/routes/tasks.js'; // パスは環境に合わせて調整
import shiftRoutes from './src/routes/shifts.js';
import staffRoutes from './src/routes/staff.js';
import businessRoutes from './src/routes/business.js';

dotenv.config();

const app = express();
const port = 5001;

// 【重要】これがないとPOSTのJSONを受け取れません
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// ルートの設定
app.use('/api/tasks', taskRoutes);

app.use('/api/shifts', shiftRoutes);

app.use('/api/staff', staffRoutes);

app.use('/api/business-info', businessRoutes);

// エラーをターミナルに強制表示するミドルウェア（必ずルーティングの設定より下に書いてください）
app.use((err, req, res, next) => {
  console.error("====== サーバーエラー発生！！ ======");
  console.error(err.stack); // これでエラーの具体的な場所（行数）がわかります
  console.error("====================================");
  res.status(500).json({ error: err.message });
});

// サーバー起動処理
const startServer = async () => {
  try {
    await connectDatabase();
  } catch (error) {
    console.warn('MongoDB connection was not established:', error.message);
  }

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

startServer();