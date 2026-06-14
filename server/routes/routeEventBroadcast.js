import express from 'express';
import { sendBroadcast, getBroadcasts, markAsRead } from '../controllers/controllerEventBroadcast.js';

const router = express.Router({ mergeParams: true });

router.get('/',   getBroadcasts);
router.post('/',  sendBroadcast);

export default router;