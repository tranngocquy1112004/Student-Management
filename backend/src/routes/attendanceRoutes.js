import express from 'express';
import * as attendanceController from '../controllers/attendanceController.js';
import { protect, checkExpelledStatus } from '../middleware/auth.js';
import { checkStudentNotOnLeave } from '../middleware/checkLeaveStatus.js';

const router = express.Router();
router.use(protect);

// Schedule validation
router.get('/attendance/validate-schedule/:classId', attendanceController.validateSchedule);

// Statistics and rates
router.get('/attendance/statistics/:classId', attendanceController.getStatistics);
router.get('/attendance/rate/:classId', checkExpelledStatus, attendanceController.getAttendanceRate);
router.get('/attendance/teacher-rates', attendanceController.getTeacherAttendanceRates);
router.get('/attendance/teacher-rates/:teacherId', attendanceController.getTeacherAttendanceRates);

// Direct check-in (no QR code required)
router.post('/classes/:classId/attendance/direct-checkin', checkExpelledStatus, checkStudentNotOnLeave, attendanceController.directCheckIn);
router.get('/classes/:classId/attendance/student-status', checkExpelledStatus, attendanceController.getStudentAttendanceStatus);

// Existing routes
router.post('/classes/:classId/attendance/sessions', attendanceController.createSession);
router.get('/classes/:classId/attendance/sessions', attendanceController.getSessions);
router.put('/attendance/sessions/:sessionId', attendanceController.updateSession);
router.post('/attendance/sessions/:sessionId/manual', attendanceController.manualCheck);
router.put('/attendance/sessions/:sessionId/manual', attendanceController.bulkManual);
router.post('/attendance/sessions/:sessionId/generate-code', attendanceController.generateCode);
router.get('/attendance/sessions/:sessionId/records', attendanceController.getSessionRecords);
router.post('/attendance/check-in', checkExpelledStatus, checkStudentNotOnLeave, attendanceController.checkIn);
router.get('/classes/:classId/attendance/report', attendanceController.getReport);
router.get('/attendance/my-attendance/:classId', checkExpelledStatus, attendanceController.getMyAttendance);

export default router;
