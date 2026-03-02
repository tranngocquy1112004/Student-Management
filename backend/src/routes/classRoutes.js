import express from 'express';
import multer from 'multer';
import * as classController from '../controllers/classController.js';
import { protect, authorize, checkExpelledStatus } from '../middleware/auth.js';
import { checkStudentNotOnLeave } from '../middleware/checkLeaveStatus.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
router.use(protect);

router.get('/', checkExpelledStatus, classController.getClasses);
router.get('/my-classes', checkExpelledStatus, classController.getMyClasses);
router.post('/', authorize('admin'), classController.createClass);
router.get('/:id', checkExpelledStatus, checkStudentNotOnLeave, classController.getClassById);
router.put('/:id', authorize('admin'), classController.updateClass);
router.delete('/:id', authorize('admin'), classController.deleteClass);
router.patch('/:id/status', authorize('admin'), classController.updateStatus);
router.get('/:id/students', classController.getClassStudents);
router.get('/:id/my-enrollment', checkExpelledStatus, checkStudentNotOnLeave, classController.getMyEnrollment);
router.post('/:id/students', authorize('admin'), classController.addStudent);
router.post('/:id/students/import', authorize('admin'), upload.single('file'), classController.importStudents);
router.delete('/:id/students/:userId', authorize('admin'), classController.removeStudent);

export default router;
