import express from 'express';
import * as attendanceController from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// Schedule validation
router.get('/attendance/validate-schedule/:classId', attendanceController.validateSchedule);

// Statistics and rates
router.get('/attendance/statistics/:classId', attendanceController.getStatistics);
router.get('/attendance/rate/:classId', attendanceController.getAttendanceRate);
router.get('/attendance/teacher-rates', attendanceController.getTeacherAttendanceRates);
router.get('/attendance/teacher-rates/:teacherId', attendanceController.getTeacherAttendanceRates);

// Existing routes
router.post('/classes/:classId/attendance/sessions', attendanceController.createSession);
router.get('/classes/:classId/attendance/sessions', attendanceController.getSessions);
router.put('/attendance/sessions/:sessionId', attendanceController.updateSession);
router.post('/attendance/sessions/:sessionId/manual', attendanceController.manualCheck);
router.put('/attendance/sessions/:sessionId/manual', attendanceController.bulkManual);
router.post('/attendance/sessions/:sessionId/generate-code', attendanceController.generateCode);
router.get('/attendance/sessions/:sessionId/records', attendanceController.getSessionRecords);
router.post('/attendance/check-in', attendanceController.checkIn);
router.get('/classes/:classId/attendance/report', attendanceController.getReport);
router.get('/attendance/my-attendance/:classId', attendanceController.getMyAttendance);

export default router;
