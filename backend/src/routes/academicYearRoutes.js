import express from 'express';
import * as academicYearController from '../controllers/academicYearController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', authorize('admin', 'teacher'), academicYearController.getAcademicYears);
router.post('/', authorize('admin'), academicYearController.createAcademicYear);
router.put('/:id', authorize('admin'), academicYearController.updateAcademicYear);
router.delete('/:id', authorize('admin'), academicYearController.deleteAcademicYear);

export default router;
