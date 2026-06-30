import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// ==========================================================
// 📋 1. 【復活！】フロントが最初に呼び出すタスク一覧取得API (GET /)
// ==========================================================
router.get('/', async (req, res, next) => {
  try {
    const Task = mongoose.model('Task');
    const dbTasks = await Task.find();

    // フロントが動くようにデータを綺麗に整形して返す
    const formattedTasks = dbTasks.map((task) => {
      const taskObj = task.toObject();
      return {
        id: taskObj.id || Math.floor(Math.random() * 1000000), // 数値型ID
        name: taskObj.name || taskObj.task_name || "名無しのタスク",
        desc: taskObj.desc || taskObj.description || "",
        pri: taskObj.pri || "mid",
        xp: taskObj.xp || 50,
        st: taskObj.st || "pending",
        to: taskObj.to || null,
        by: taskObj.by || null,
        inPool: taskObj.inPool ?? true
      };
    });

    res.json(formattedTasks);
  } catch (error) {
    next(error);
  }
});

// ==========================================================
// 📥 2. アルバイトからの完了報告を受け付け、社員へ通知を送るAPI (POST /submit/:assignmentId)
// ==========================================================
router.post('/submit/:assignmentId', async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const Task = mongoose.model('Task');
    const NotificationModel = mongoose.model('Notification');

    // フロントのID(数値)からタスク名を探す
    const targetTask = await Task.findOne({ id: Number(assignmentId) });
    const taskName = targetTask ? targetTask.name : "闇鍋タスク";

    // 安全な .create() でDBに通知を直接作成
    await NotificationModel.create({
      id: Date.now() + Math.floor(Math.random() * 1000),
      title: 'タスク完了報があります',
      sub: `「${taskName}」の完了報告が届いています`,
      read: false,
      uid: 1, 
      taskId: Number(assignmentId),
    });

    // フロントへ大成功の返事
    res.json({ 
      success: true, 
      status: 'review', 
      id: Number(assignmentId) 
    });

  } catch (error) {
    next(error);
  }
});

export default router;