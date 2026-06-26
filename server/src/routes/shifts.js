import express from 'express';
import { getShifts, createShiftRequest, createConfirmedShift } from '../controllers/shiftController.js';

const router = express.Router();

router.get('/', getShifts);                  // シフト一覧取得
router.post('/request', createShiftRequest);  // シフト希望提出
router.post('/confirm', createConfirmedShift); // 確定シフト作成

export default router;