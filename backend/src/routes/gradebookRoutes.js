import express from 'express';
import * as gradebookController from '../controllers/gradebookController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/classes/:classId/gradebook', gradebookController.getGradebook);
router.put('/classes/:classId/gradebook/:studentId', gradebookController.updateGradeByStudentId);
router.post('/classes/:classId/gradebook/bulk', gradebookController.bulkUpdate);
router.get('/classes/:classId/gradebook/export', gradebookController.exportGradebook);

export default router;
