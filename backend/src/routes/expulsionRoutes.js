import express from 'express';
import multer from 'multer';
import * as expulsionController from '../controllers/expulsionController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Admin routes
router.post(
  '/admin/expulsions',
  protect,
  restrictTo('admin'),
  upload.array('attachments', 5),
  expulsionController.createExpulsion
);

router.get(
  '/admin/expulsions',
  protect,
  restrictTo('admin'),
  expulsionController.getExpulsionList
);

router.get(
  '/admin/expulsions/:id',
  protect,
  restrictTo('admin'),
  expulsionController.getExpulsionById
);

router.put(
  '/admin/expulsions/:id/approve-appeal',
  protect,
  restrictTo('admin'),
  expulsionController.approveAppeal
);

router.put(
  '/admin/expulsions/:id/reject-appeal',
  protect,
  restrictTo('admin'),
  expulsionController.rejectAppeal
);

// Student routes
router.get(
  '/students/expulsions/me',
  protect,
  restrictTo('student'),
  expulsionController.getMyExpulsion
);

router.put(
  '/students/expulsions/:id/appeal',
  protect,
  restrictTo('student'),
  upload.array('evidence', 5),
  expulsionController.submitAppeal
);

export default router;
