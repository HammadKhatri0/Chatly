import { Router } from 'express';
import {
  listConversations,
  getConversation,
  openDirectConversation,
  createGroup,
  updateGroup,
  addMembers,
  removeMember,
  markAsRead,
  deleteConversation,
  listGroupCandidates,
} from '../controllers/conversationController.js';
import { listMessages, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();
router.use(protect);

router.get('/', listConversations);
router.get('/candidates', listGroupCandidates);
router.post('/direct', openDirectConversation);
router.post('/group', upload.single('avatar'), createGroup);

router.get('/:id', getConversation);
router.patch('/:id', upload.single('avatar'), updateGroup);
router.delete('/:id', deleteConversation);
router.post('/:id/members', addMembers);
router.delete('/:id/members/:userId', removeMember);
router.patch('/:id/read', markAsRead);

router.get('/:id/messages', listMessages);
router.post('/:id/messages', upload.single('file'), sendMessage);

export default router;
