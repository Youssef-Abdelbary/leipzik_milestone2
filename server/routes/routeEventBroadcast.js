import express from 'express';
import { sendBroadcast, getBroadcasts } from '../controllers/controllerEventBroadcast.js';

// mergeParams lets this router access :eventId from the parent event router
const router = express.Router({ mergeParams: true });

router.get('/', getBroadcasts);
router.post('/', sendBroadcast);

export default router;