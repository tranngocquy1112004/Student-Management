import express from 'express';
import * as teacherController from '../controllers/teacherController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', authorize('admin', 'teacher'), teacherController.getTeachers);
router.get('/:id', authorize('admin'), teacherController.getTeacherById);
router.put('/:id', authorize('admin'), teacherController.updateTeacher);
router.get('/:id/classes', authorize('admin', 'teacher'), teacherController.getTeacherClasses);

export default router;
