import express from 'express';
import * as subjectController from '../controllers/subjectController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.get('/', subjectController.getSubjects);
router.post('/', authorize('admin'), subjectController.createSubject);
router.get('/:id', subjectController.getSubjectById);
router.put('/:id', authorize('admin'), subjectController.updateSubject);
router.delete('/:id', authorize('admin'), subjectController.deleteSubject);

export default router;
