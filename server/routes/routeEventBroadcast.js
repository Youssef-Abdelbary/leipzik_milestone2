import express from 'express';
import {
  sendBroadcast,
  getBroadcasts,
  getUnseenRecipients,
} from '../controllers/controllerEventBroadcast.js';

// mergeParams: true gives us req.params.eventId from the parent router
const router = express.Router({ mergeParams: true });

router.get('/',                         getBroadcasts);
router.post('/',                        sendBroadcast);
router.get('/:broadcastId/unseen',      getUnseenRecipients);   // NEW

export default router;