import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/admin', authorize('admin'), dashboardController.getAdminDashboard);
router.get('/teacher', authorize('teacher'), dashboardController.getTeacherDashboard);
router.get('/student', authorize('student'), dashboardController.getStudentDashboard);

export default router;
