import { Router } from 'express';
import {
  getMyProfile,
  updateMyProfile,
  getUserById,
  searchUsers,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();
router.use(protect);

router.get('/me', getMyProfile);
router.patch('/me', upload.single('avatar'), updateMyProfile);
router.get('/search', searchUsers);
router.get('/:id', getUserById);

export default router;
