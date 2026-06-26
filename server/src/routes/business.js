import express from 'express';
import { getBusinessInfo, updateBusinessInfo } from '../controllers/businessController.js';

const router = express.Router();

router.get('/', getBusinessInfo);    // 設定の取得
router.post('/', updateBusinessInfo); // 設定の保存・更新

export default router;