import { Router } from 'express';
import {
  getAllGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
  getStudentGrades
} from '../controllers/gradeController.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/mine', getStudentGrades);
router.get('/', requireRole('admin', 'teacher'), getAllGrades);
router.get('/:id', getGradeById);
router.post('/', requireRole('admin', 'teacher'), createGrade);
router.put('/:id', requireRole('admin', 'teacher'), updateGrade);
router.delete('/:id', requireRole('admin'), deleteGrade);

export default router;
