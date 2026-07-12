import express from 'express';
import mongoose from 'mongoose';
import { getDb } from '../config/database.js';

const router = express.Router();

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'manager' || value === 'staff' || value === 'part') return value;
  if (value === 'admin') return 'manager';
  return 'staff';
};

const toDbRole = (role) => {
  const value = normalizeRole(role);
  if (value === 'manager') return 'MANAGER';
  return 'STAFF';
};

router.get('/', async (req, res, next) => {
  try {
    const db = await await getDb();
    const users = await db.collection('users').find().toArray();
    
    const formattedUsers = users.map(u => ({
      ...u,
      id: u.id,
      role: normalizeRole(u.role)
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, role, hourlyWage, monthlySalary } = req.body;
    if (!name) {
      return res.status(400).json({ error: '名前は必須です' });
    }

    const db = await await getDb();
    const allUsers = await db.collection('users').find().toArray();

    const newId = allUsers.length > 0 ? Math.max(...allUsers.map((u) => u.id || 0)) + 1 : 1;
    const password = `pass${String(newId).padStart(4, '0')}`;
    const ini = name.trim().charAt(0) || 'S';
    const username = `user_${newId}`;
    const email = `${username}@example.com`;

    const newUser = {
      id: newId,
      username,
      email,
      name: name.trim(),
      role: toDbRole(role),
      xp: 0,
      ini,
      password,
      created_at: new Date()
    };

    if (normalizeRole(role) === 'part') {
      newUser.hourlyWage = hourlyWage !== undefined ? hourlyWage : 1050;
    } else {
      newUser.monthlySalary = monthlySalary !== undefined ? monthlySalary : 250010;
    }

    await db.collection('users').insertOne(newUser);
    res.status(201).json({
      ...newUser,
      role: normalizeRole(newUser.role),
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const db = await await getDb();
    
    const user = await db.collection('users').findOne({ id });
    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    const { xp, hourlyWage, monthlySalary, name, role } = req.body;
    const updateData = {};

    if (xp !== undefined) updateData.xp = parseInt(xp, 10);
    if (hourlyWage !== undefined) updateData.hourlyWage = parseInt(hourlyWage, 10);
    if (monthlySalary !== undefined) updateData.monthlySalary = parseInt(monthlySalary, 10);
    if (name !== undefined) {
      updateData.name = name.trim();
      updateData.ini = name.trim().charAt(0) || 'S';
    }
    if (role !== undefined) updateData.role = toDbRole(role);

    await db.collection('users').updateOne({ id }, { $set: updateData });
    
    const updatedUser = await db.collection('users').findOne({ id });
    res.json({
      ...updatedUser,
      role: normalizeRole(updatedUser.role),
    });
  } catch (error) {
    next(error);
  }
});

export default router;