import { Router } from 'express';
import { searchMessages, deleteMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/search', searchMessages);
router.delete('/:messageId', deleteMessage);

export default router;
