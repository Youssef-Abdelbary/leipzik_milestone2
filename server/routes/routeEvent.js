import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { listEvents, createEvent, getEvent } from '../controllers/controllerEvent.js';

const router = express.Router();

router.use(authenticate);

router.get('/', listEvents);
router.post('/', createEvent);
router.get('/:eventId', getEvent);

export default router;