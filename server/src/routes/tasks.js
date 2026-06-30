import express from 'express';
import mongoose from 'mongoose'; // 🔥 これが絶対に必要です！
import { 
  getTasks, 
  createTask, 
  updateTask,   
  deleteTask, 
  getAvailableTasks 
} from '../controllers/taskController.js';

const router = express.Router();

// ==========================================================
// 📋 1. フロントが最初に呼び出すタスク一覧取得API (GET /)
// ==========================================================
router.get('/', async (req, res, next) => {
  try {
    const Task = mongoose.model('Task');
    const dbTasks = await Task.find();

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
// 📥 2. アルバイトからの完了報告を受け付けるAPI (POST /submit/:assignmentId)
// ==========================================================
router.post('/submit/:assignmentId', async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const Task = mongoose.model('Task');
    const NotificationModel = mongoose.model('Notification');
    const taskIdNum = Number(assignmentId);

    // 🛡️ 【連打ガード】すでに同じタスクの通知があれば、エラーにせず成功を返してスルー
    const existingNotification = await NotificationModel.findOne({ taskId: taskIdNum });
    if (existingNotification) {
      console.log(`⚠️ [連打無視] タスクID: ${taskIdNum} は既に報告済みです。`);
      return res.json({ success: true, status: 'review', id: taskIdNum });
    }

    // フロントのID(数値)からタスク名を探す
    const targetTask = await Task.findOne({ id: taskIdNum });
    const taskName = targetTask ? (targetTask.name || targetTask.task_name) : "定番タスク";

    // 安全な .create() でDBに通知を直接作成
    await NotificationModel.create({
      id: Date.now() + Math.floor(Math.random() * 1000),
      title: 'タスク完了報告があります',
      sub: `「${taskName}」の完了報告が届いています`,
      read: false,
      uid: 1, 
      taskId: taskIdNum,
    });

    console.log(`🎉 [処理成功] タスクID: ${taskIdNum} の完了報告を受け付けました！`);

    // フロントへ大成功の返事（これでフロントがreviewに切り替わる！）
    res.json({ 
      success: true, 
      status: 'review', 
      id: taskIdNum 
    });

  } catch (error) {
    next(error);
  }
});

export default router;