import { getDb } from '../config/database.js';
import { logError } from '../utils/logger.js';
import { buildTaskInsertPayload, buildTaskUpdatePayload, parseTaskId, toTaskViewModel } from '../services/taskService.js';

// 1. タスク一覧取得
export const getTasks = async (req, res) => {
  try {
    const db = await getDb();
    const rawTasks = await db.collection('tasks').find().sort({ created_at: -1 }).toArray();
    const tasks = rawTasks.map(toTaskViewModel);

    res.status(200).json(tasks);
  } catch (error) {
    logError("getTasksでエラー:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. タスク作成
export const createTask = async (req, res) => {
  try {
    const db = await getDb();
    
    const taskData = buildTaskInsertPayload(req.body);

    const result = await db.collection('tasks').insertOne(taskData);
    
    const saved = await db.collection('tasks').findOne({ _id: result.insertedId });
    const formattedTask = toTaskViewModel(saved);

    res.status(201).json(formattedTask);
  } catch (error) {
    logError("createTaskでエラー:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. ガチャ用タスク取得
export const getAvailableTasks = async (req, res) => {
  try {
    const db = await getDb();
    const rawTasks = await db.collection('tasks').find({ is_gacha_target: true }).toArray();
    const tasks = rawTasks.map((taskDoc) => ({ ...toTaskViewModel(taskDoc), inPool: true }));

    res.status(200).json(tasks);
  } catch (error) {
    logError("getAvailableTasksでエラー:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 4. タスク更新
export const updateTask = async (req, res) => {
  try {
    const db = await getDb();
    const id = parseTaskId(req.params.id);
    const updateData = buildTaskUpdatePayload(req.body);

    await db.collection('tasks').updateOne({ _id: id }, { $set: updateData });
    
    const saved = await db.collection('tasks').findOne({ _id: id });
    const formattedTask = toTaskViewModel(saved);

    res.status(200).json(formattedTask);
  } catch (error) {
    logError("updateTaskでエラー:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 5. タスク削除
export const deleteTask = async (req, res) => {
  try {
    const db = await getDb();
    const id = parseTaskId(req.params.id);
    
    await db.collection('tasks').deleteOne({ _id: id });
    res.status(200).json({ success: true, message: '削除しました' });
  } catch (error) {
    logError("deleteTaskでエラー:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};