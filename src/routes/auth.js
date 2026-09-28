import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile, deleteUser, createUserByAdmin, refreshSession, logoutSession } from '../controllers/authController.js';
import { authenticateToken, requireRole, requireAllowedOrigin } from '../middlewares/authMiddleware.js';

const router = Router();

// P2: el refresh usa cookie httpOnly; se limita aparte y exige origen permitido (CSRF).
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones, intenta más tarde' }
});

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshLimiter, requireAllowedOrigin, refreshSession);
router.post('/logout', requireAllowedOrigin, logoutSession);
router.get('/profile', authenticateToken, getProfile);
router.post('/users', authenticateToken, requireRole('admin'), createUserByAdmin);
router.delete('/users/:id', authenticateToken, requireRole('admin'), deleteUser);

export default router;
