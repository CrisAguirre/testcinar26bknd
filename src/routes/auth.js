import { Router } from 'express';
import { register, login, getProfile, deleteUser, createUserByAdmin } from '../controllers/authController.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.post('/users', authenticateToken, requireRole('admin'), createUserByAdmin);
router.delete('/users/:id', authenticateToken, requireRole('admin'), deleteUser);

export default router;
