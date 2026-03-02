import express from 'express';
import * as warningController from '../controllers/warningController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Admin routes
router.get(
  '/admin/warnings',
  protect,
  restrictTo('admin'),
  warningController.getWarningList
);

// Student routes
router.get(
  '/students/warnings/me',
  protect,
  restrictTo('student'),
  warningController.getMyWarnings
);

// Teacher routes
router.get(
  '/teachers/warnings/class/:classId',
  protect,
  restrictTo('teacher'),
  warningController.getClassWarnings
);

export default router;
