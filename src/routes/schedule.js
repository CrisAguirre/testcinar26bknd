import { Router } from 'express';
import { getSchedule } from '../controllers/scheduleController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticateToken, getSchedule);

export default router;
