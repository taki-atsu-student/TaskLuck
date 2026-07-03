import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// ==========================================================
// 🔔 1. 【修正】URLの重複を防ぐため、ルートパスを '/' にします
// ==========================================================
router.get('/', async (req, res, next) => {
  try {
    const NotificationModel = mongoose.model('Notification');
    
    // DBから通知を全件取得
    const dbNotifications = await NotificationModel.find().sort({ id: -1 });

    // フロントが期待するデータ構造にマッピング
    const formattedNotifications = dbNotifications.map(notif => {
      const notifObj = notif.toObject();
      return {
        id: notifObj.id,
        title: notifObj.title || "タスク完了報告があります",
        sub: notifObj.sub || "",
        read: notifObj.read ?? false,
        uid: notifObj.uid || 1,
        taskId: notifObj.taskId || null
      };
    });

    res.json(formattedNotifications);
  } catch (error) {
    next(error);
  }
});

// ⚠️ 注意：もともとあった「GET / (ビジネスルール取得)」の記述とバッティングするので、
// ビジネスルール側の記述は消去するか、使われていなければこのままでOKです。
// （※もしビジネスルールも同時に使っている場合は教えてください！）

export default router;