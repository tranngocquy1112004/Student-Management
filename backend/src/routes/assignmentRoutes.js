import express from 'express';
import * as assignmentController from '../controllers/assignmentController.js';
import * as submissionController from '../controllers/submissionController.js';
import { protect, checkExpelledStatus } from '../middleware/auth.js';
import { checkStudentNotOnLeave } from '../middleware/checkLeaveStatus.js';
import { uploadFile, uploadFiles } from '../config/upload.js';

const router = express.Router();
router.use(protect);

router.get('/classes/:classId/assignments', checkExpelledStatus, assignmentController.getAssignments);
router.post('/classes/:classId/assignments', assignmentController.createAssignment);
router.get('/assignments/download/:filename', checkExpelledStatus, assignmentController.downloadAttachment);
router.get('/assignments/:id', checkExpelledStatus, assignmentController.getAssignmentById);
router.get('/assignments/:id/answer-key', assignmentController.downloadAnswerKey);
router.put('/assignments/:id', assignmentController.updateAssignment);
router.delete('/assignments/:id', assignmentController.deleteAssignment);
router.post('/assignments/:id/attachments', uploadFile, assignmentController.addAttachment);
router.patch('/assignments/:id/publish', assignmentController.publishAssignment);
router.patch('/assignments/:id/close', assignmentController.closeAssignment);
router.patch('/assignments/:id/status', assignmentController.updateAssignmentStatus);

router.post('/assignments/:id/submit', checkExpelledStatus, checkStudentNotOnLeave, uploadFiles, submissionController.submit);
router.put('/assignments/:id/resubmit', checkExpelledStatus, checkStudentNotOnLeave, uploadFiles, submissionController.resubmit);
router.get('/assignments/:id/my-submission', checkExpelledStatus, submissionController.getMySubmission);
router.get('/assignments/:id/submissions', submissionController.getSubmissions);
router.get('/submissions/:id', submissionController.getSubmissionById);
router.get('/submissions/:id/download', submissionController.downloadSubmission);
router.post('/submissions/:id/grade', submissionController.gradeSubmission);
router.put('/submissions/:id/grade', submissionController.gradeSubmission);

export default router;
