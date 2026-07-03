import express from 'express';
import mongoose from 'mongoose'; 
import { 
  getTasks, 
  createTask, 
  updateTask,   
  deleteTask, 
  getAvailableTasks 
} from '../controllers/taskController.js';

const router = express.Router();

router.get('/', getTasks);

router.post('/submit/:assignmentId', async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const Task = mongoose.model('Task');
    const NotificationModel = mongoose.model('Notification');
    const taskIdNum = Number(assignmentId);

    const existingNotification = await NotificationModel.findOne({ taskId: taskIdNum });
    if (existingNotification) {
      console.log(`⚠️ [連打無視] タスクID: ${taskIdNum}`);
      return res.json({ success: true, status: 'review', id: taskIdNum });
    }

    const targetTask = await Task.findOne({ id: taskIdNum });
    const taskName = targetTask ? (targetTask.name || targetTask.task_name) : "定番タスク";

    await NotificationModel.create({
      id: Date.now() + Math.floor(Math.random() * 1000),
      title: 'タスク完了報告があります',
      sub: `「${taskName}」の完了報告が届いています`,
      read: false,
      uid: 1, 
      taskId: taskIdNum,
    });

    console.log(`🎉 [処理成功] タスクID: ${taskIdNum}`);
    res.json({ success: true, status: 'review', id: taskIdNum });

  } catch (error) {
    next(error);
  }
});

router.get('/available', getAvailableTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;