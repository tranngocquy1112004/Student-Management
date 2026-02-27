import express from 'express';
import multer from 'multer';
import * as scoreController from '../controllers/scoreController.js';
import { protect, authorize } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
router.use(protect);

router.get('/', scoreController.getScores);
router.post('/', authorize('admin', 'teacher'), scoreController.createScore);
router.put('/:id', authorize('admin', 'teacher'), scoreController.updateScore);
router.delete('/:id', authorize('admin'), scoreController.deleteScore);
router.patch('/:id/lock', authorize('admin', 'teacher'), scoreController.lockScore);
router.post('/import', authorize('admin', 'teacher'), upload.single('file'), scoreController.importScores);
router.get('/export', authorize('admin', 'teacher'), scoreController.exportScores);

export default router;
