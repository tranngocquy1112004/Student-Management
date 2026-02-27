import express from 'express';
import * as facultyController from '../controllers/facultyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', facultyController.getFaculties);
router.post('/', authorize('admin'), facultyController.createFaculty);
router.put('/:id', authorize('admin'), facultyController.updateFaculty);
router.delete('/:id', authorize('admin'), facultyController.deleteFaculty);

export default router;
