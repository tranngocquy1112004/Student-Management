import express from 'express';
import * as leaveController from '../controllers/leaveController.js';
import { protect, authorize, checkExpelledStatus } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Student routes
router.post('/students/leave/request', authorize('student'), checkExpelledStatus, leaveController.submitRequest);
router.get('/students/leave/my-requests', authorize('student'), checkExpelledStatus, leaveController.getMyRequests);

// Admin routes
router.get('/admin/leave-requests', authorize('admin'), leaveController.getPendingRequests);
router.put('/admin/leave-requests/:id/approve', authorize('admin'), leaveController.approveRequest);
router.put('/admin/leave-requests/:id/reject', authorize('admin'), leaveController.rejectRequest);

export default router;
