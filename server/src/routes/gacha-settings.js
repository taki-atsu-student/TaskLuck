import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// ==========================================
// 🎯 社員以上が「許可（承認）」または「拒否」をする
//    POST /api/gacha-settings/review/:assignmentId 
// ==========================================
router.post('/review/:assignmentId', async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const { action, approvedByUserId, comment } = req.body; // action: 'APPROVE' または 'REJECT'
    
    const TaskAssignment = mongoose.model('TaskAssignment');
    const Task = mongoose.model('Task');
    const User = mongoose.model('User');
    const Notification = mongoose.model('Notification'); 

    // 1. 対象の割当データを取得
    const assignment = await TaskAssignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: "指定された割当データが見つかりません。" });
    }

    const originalTask = await Task.findById(assignment.task_id);
    const taskName = originalTask ? originalTask.task_name : "割り当てられたタスク";

    // ==========================================
    // パターンA: 【許可（APPROVE）】の場合
    // ==========================================
    if (action === 'APPROVE') {
      assignment.status = 'APPROVED';
      assignment.approved_at = new Date();
      assignment.approved_by = approvedByUserId;
      await assignment.save();

      // 経験値(XP)の付与（一本化した構造 current_xp に合わせる）
      if (originalTask) {
        await User.findByIdAndUpdate(assignment.user_id, {
          $inc: { current_xp: originalTask.xp } // 💡 完全版のフィールド名に調整
        });
        await Task.findByIdAndDelete(assignment.task_id);
      }

      // アルバイトへの「合格通知」をDBに作成
      const newNotification = new Notification({
        user_id: assignment.user_id,
        title: "🎉 タスク承認完了！",
        message: `「${taskName}」が承認されました！XPを獲得しました。次のガチャが引けます！`,
        type: 'APPROVE',
        created_at: new Date()
      });
      await newNotification.save();

      return res.json({ 
        message: "タスクを承認し、元のタスクを消滅させました！次のガチャが解放されます。", 
        status: 'APPROVED' 
      });
    }

    // ==========================================
    // パターンB: 【拒否（REJECT）】の場合
    // ==========================================
    if (action === 'REJECT') {
      assignment.status = 'ASSIGNED'; 
      await assignment.save();

      // アルバイトへの「不合格・やり直し通知」をDBに作成
      const newNotification = new Notification({
        user_id: assignment.user_id,
        title: "⚠️ タスクやり直し通知",
        message: `「${taskName}」の承認が見見送られました。理由: ${comment || 'もう一度確認してください'}`,
        type: 'REJECT',
        created_at: new Date()
      });
      await newNotification.save();

      return res.json({ 
        message: "タスクを拒否しました。アルバイトの画面をやり直し状態に戻します。", 
        status: 'ASSIGNED' 
      });
    }

    res.status(400).json({ error: "不正なアクションです（APPROVEまたはREJECTを指定してください）" });
  } catch (error) {
    next(error);
  }
});

export default router;