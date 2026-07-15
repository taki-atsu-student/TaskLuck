import express from 'express';
import { drawGacha, getGachaLog, getGachaCount } from '../controllers/gachaController.js';

const router = express.Router();

router.post('/pull', drawGacha);
router.get('/gachalog', getGachaLog);
router.get('/gachalog/count', getGachaCount);

export default router;