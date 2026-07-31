import express from 'express';
import { getTechnicianPerformance } from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/performance', protect, authorize('admin'), getTechnicianPerformance);

export default router;
