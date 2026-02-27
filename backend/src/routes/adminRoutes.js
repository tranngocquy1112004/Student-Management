import express from 'express';
import multer from 'multer';
import * as adminUserController from '../controllers/adminUserController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../validators/commonValidator.js';
import * as userValidator from '../validators/userValidator.js';
import { sanitizeBody } from '../middleware/sanitizeBody.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
router.use(protect);
router.use(authorize('admin'));
router.use(sanitizeBody);

router.get('/users', adminUserController.getUsers);
router.post('/users', validate(userValidator.createUserSchema), adminUserController.createUser);
router.post('/users/import-csv', upload.single('file'), adminUserController.importCsv);
router.get('/users/:id', adminUserController.getUserById);
router.put('/users/:id', validate(userValidator.updateUserSchema), adminUserController.updateUser);
router.delete('/users/:id', adminUserController.deleteUser);
router.patch('/users/:id/lock', adminUserController.lockUser);
router.patch('/users/:id/unlock', adminUserController.unlockUser);
router.patch('/users/:id/reset-password', adminUserController.resetPassword);

export default router;
