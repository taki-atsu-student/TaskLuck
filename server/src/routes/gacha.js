import express from 'express';
import { drawGacha, getGachaHistory, getGachaCount } from '../controllers/gachaController.js';

const router = express.Router();

router.post('/pull', drawGacha);
router.get('/history', getGachaHistory);
router.get('/history/count', getGachaCount);

export default router;