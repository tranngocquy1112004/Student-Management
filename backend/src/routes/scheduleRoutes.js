import express from 'express';
import * as scheduleController from '../controllers/scheduleController.js';
import { protect, checkExpelledStatus } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/classes/:classId/schedules', checkExpelledStatus, scheduleController.getSchedules);
router.post('/classes/:classId/schedules', scheduleController.createSchedule);
router.post('/classes/:id/schedules/bulk', scheduleController.bulkCreateSchedules);
router.delete('/classes/:id/schedules/bulk', scheduleController.bulkDeleteSchedules);
router.put('/schedules/:id', scheduleController.updateSchedule);
router.delete('/schedules/:id', scheduleController.deleteSchedule);
router.get('/schedules/my-schedule', checkExpelledStatus, scheduleController.getMySchedule);
router.get('/classes/:id/remaining-lessons', scheduleController.getRemainingLessons);

export default router;
