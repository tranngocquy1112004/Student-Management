import express from 'express';
import multer from 'multer';
import * as violationController from '../controllers/violationController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Teacher routes
router.post(
  '/teachers/violations',
  protect,
  restrictTo('teacher'),
  upload.array('evidence', 5),
  violationController.reportViolation
);

// Admin routes
router.get(
  '/admin/violations',
  protect,
  restrictTo('admin'),
  violationController.getViolationList
);

router.put(
  '/admin/violations/:id/convert',
  protect,
  restrictTo('admin'),
  violationController.convertToExpulsion
);

router.put(
  '/admin/violations/:id/dismiss',
  protect,
  restrictTo('admin'),
  violationController.dismissViolation
);

export default router;
