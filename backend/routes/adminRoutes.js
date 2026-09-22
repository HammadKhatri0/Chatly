import { Router } from 'express';
import {
  getStats,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  listConversations,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();
router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/conversations', listConversations);
router.route('/users').get(listUsers).post(createUser);
router
  .route('/users/:id')
  .get(getUser)
  .patch(upload.single('avatar'), updateUser)
  .delete(deleteUser);

export default router;
