import { Router } from 'express';
import { getMyEnrollments, enrollUser, unenrollUser, getCourseEnrollments } from '../controllers/enrollmentController.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/mine', getMyEnrollments);
router.post('/', requireRole('admin', 'teacher'), enrollUser);
router.get('/course/:course', requireRole('admin', 'teacher'), getCourseEnrollments);
router.delete('/:userId/:course', requireRole('admin'), unenrollUser);

export default router;
