import express from 'express';
import * as assignmentController from '../controllers/assignmentController.js';
import * as submissionController from '../controllers/submissionController.js';
import { protect } from '../middleware/auth.js';
import { uploadFile, uploadFiles } from '../config/upload.js';

const router = express.Router();
router.use(protect);

router.get('/classes/:classId/assignments', assignmentController.getAssignments);
router.post('/classes/:classId/assignments', assignmentController.createAssignment);
router.get('/assignments/download/:filename', assignmentController.downloadAttachment);
router.get('/assignments/:id', assignmentController.getAssignmentById);
router.get('/assignments/:id/answer-key', assignmentController.downloadAnswerKey);
router.put('/assignments/:id', assignmentController.updateAssignment);
router.delete('/assignments/:id', assignmentController.deleteAssignment);
router.post('/assignments/:id/attachments', uploadFile, assignmentController.addAttachment);
router.patch('/assignments/:id/publish', assignmentController.publishAssignment);
router.patch('/assignments/:id/close', assignmentController.closeAssignment);
router.patch('/assignments/:id/status', assignmentController.updateAssignmentStatus);

router.post('/assignments/:id/submit', uploadFiles, submissionController.submit);
router.put('/assignments/:id/resubmit', uploadFiles, submissionController.resubmit);
router.get('/assignments/:id/my-submission', submissionController.getMySubmission);
router.get('/assignments/:id/submissions', submissionController.getSubmissions);
router.get('/submissions/:id', submissionController.getSubmissionById);
router.get('/submissions/:id/download', submissionController.downloadSubmission);
router.post('/submissions/:id/grade', submissionController.gradeSubmission);
router.put('/submissions/:id/grade', submissionController.gradeSubmission);

export default router;
