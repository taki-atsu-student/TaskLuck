import { ObjectId } from 'mongodb';

export const toTaskViewModel = (taskDoc) => ({
  id: taskDoc._id.toString(),
  name: taskDoc.task_name || '',
  desc: taskDoc.description || '',
  pri: (taskDoc.priority || 'mid').toLowerCase(),
  xp: parseInt(taskDoc.xp, 10) || 0,
  st: taskDoc.status || 'pending',
  inPool: taskDoc.is_gacha_target || false,
  // assign fields (if present) — convert to numbers when possible
  to: taskDoc.to !== undefined && taskDoc.to !== null ? (Number.isFinite(Number(taskDoc.to)) ? Number(taskDoc.to) : taskDoc.to) : null,
  by: taskDoc.by !== undefined && taskDoc.by !== null ? (Number.isFinite(Number(taskDoc.by)) ? Number(taskDoc.by) : taskDoc.by) : null,
});

export const buildTaskInsertPayload = (body = {}) => ({
  task_name: body.name || body.task_name,
  description: body.desc || body.description || '',
  xp: parseInt(body.xp, 10) || 0,
  priority: (body.pri || 'mid').toUpperCase(),
  status: body.st || 'pending',
  is_gacha_target: body.inPool || false,
  // allow optional assignment on create
  to: body.to !== undefined ? body.to : undefined,
  by: body.by !== undefined ? body.by : undefined,
  created_at: new Date(),
});

export const buildTaskUpdatePayload = (body = {}) => {
  const updateData = {
    task_name: body.name || body.task_name,
    description: body.desc || body.description,
    xp: body.xp !== undefined ? parseInt(body.xp, 10) : undefined,
    priority: body.pri ? body.pri.toUpperCase() : undefined,
    status: body.st,
    is_gacha_target: body.inPool,
    // support updating assignee fields
    to: body.to !== undefined ? body.to : undefined,
    by: body.by !== undefined ? body.by : undefined,
  };

  Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);
  return updateData;
};

export const parseTaskId = (id) => new ObjectId(id);
