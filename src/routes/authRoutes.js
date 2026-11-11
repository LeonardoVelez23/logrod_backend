import { Router } from 'express';
import { login, forgotPassword, resetPassword } from '../controllers/authController.js';
import { loginLimiter, forgotPasswordLimiter, resetPasswordLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.post('/login', loginLimiter, login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

export default router;
