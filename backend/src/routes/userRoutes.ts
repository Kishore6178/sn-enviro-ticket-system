import express from 'express';
import { getTechnicianPerformance } from '../controllers/userController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/performance', protect, adminOnly, getTechnicianPerformance);

export default router;
