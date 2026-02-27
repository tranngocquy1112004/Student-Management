import express from 'express';
import * as studentController from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.use(authorize('student'));

router.get('/my-grades', studentController.getMyGrades);
router.get('/my-grades/:classId', studentController.getMyGradesByClass);

export default router;
