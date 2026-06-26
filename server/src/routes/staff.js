import express from 'express';
import { getStaffList, createStaff, addStaffXp } from '../controllers/staffController.js';

const router = express.Router();

router.get('/', getStaffList);        // スタッフ一覧取得
router.post('/', createStaff);       // スタッフ新規登録
router.post('/add-xp', addStaffXp);   // XPの加算処理

export default router;