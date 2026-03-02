import express from 'express';
import * as userController from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Teacher/Admin can reset student password (must be before admin-only routes)
router.post('/:id/reset-password', 
  protect, 
  authorize('teacher', 'admin'), 
  userController.resetStudentPassword
);

// Admin-only routes
router.use(protect);
router.use(authorize('admin'));
router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/status', userController.updateStatus);
router.patch('/:id/reset-password', userController.resetPassword);

export default router;
