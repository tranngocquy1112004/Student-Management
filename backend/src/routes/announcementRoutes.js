import express from 'express';
import * as announcementController from '../controllers/announcementController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/classes/:classId/announcements', announcementController.getAnnouncements);
router.post('/classes/:classId/announcements', announcementController.createAnnouncement);
router.delete('/announcements/:id', announcementController.deleteAnnouncement);

export default router;
