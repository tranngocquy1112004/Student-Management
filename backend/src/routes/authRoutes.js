import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../validators/commonValidator.js';
import * as authValidator from '../validators/authValidator.js';
import { sanitizeBody } from '../middleware/sanitizeBody.js';
import { uploadAvatar } from '../config/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
router.use(sanitizeBody);
router.post('/login', validate(authValidator.loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', validate(authValidator.forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-otp', validate(authValidator.verifyOtpSchema), authController.verifyOtp);
router.post('/reset-password', validate(authValidator.resetPasswordSchema), authController.resetPassword);
router.use(protect);
router.get('/me', authController.getMe);
router.put('/me', authController.updateMe);
router.put('/change-password', validate(authValidator.changePasswordSchema), authController.changePassword);
router.put('/me/avatar', uploadAvatar, authController.uploadAvatar);

export default router;
