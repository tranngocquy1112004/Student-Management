import express from 'express';
import * as scheduleController from '../controllers/scheduleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/classes/:classId/schedules', scheduleController.getSchedules);
router.post('/classes/:classId/schedules', scheduleController.createSchedule);
router.put('/schedules/:id', scheduleController.updateSchedule);
router.delete('/schedules/:id', scheduleController.deleteSchedule);
router.get('/schedules/my-schedule', scheduleController.getMySchedule);

export default router;
