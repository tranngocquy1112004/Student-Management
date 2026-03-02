import express from 'express';
import * as statisticsController from '../controllers/statisticsController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Admin routes
router.get(
  '/admin/statistics/expulsions',
  protect,
  restrictTo('admin'),
  statisticsController.getExpulsionStatistics
);

export default router;
