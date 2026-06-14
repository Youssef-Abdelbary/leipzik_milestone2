import express from 'express';
import { markAsRead } from '../controllers/controllerEventBroadcast.js';

const router = express.Router();

// Public — no authenticate middleware
// Called by email clients loading the tracking pixel or guests clicking "mark as received"
router.get('/read/:token', markAsRead);

export default router;