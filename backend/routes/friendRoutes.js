import { Router } from 'express';
import {
  listFriends,
  listRequests,
  sendRequest,
  respondToRequest,
  cancelRequest,
  unfriend,
} from '../controllers/friendController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', listFriends);
router.get('/requests', listRequests);
router.post('/requests', sendRequest);
router.patch('/requests/:id', respondToRequest);
router.delete('/requests/:id', cancelRequest);
router.delete('/:id', unfriend);

export default router;
