import express from 'express';
import * as semesterController from '../controllers/semesterController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', authorize('admin', 'teacher'), semesterController.getSemesters);
router.post('/', authorize('admin'), semesterController.createSemester);
router.put('/:id', authorize('admin'), semesterController.updateSemester);
router.delete('/:id', authorize('admin'), semesterController.deleteSemester);

export default router;
