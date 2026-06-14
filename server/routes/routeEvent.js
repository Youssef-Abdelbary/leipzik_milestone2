import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  listEvents, createEvent, getEvent, updateEvent, deleteEvent,
} from '../controllers/controllerEvent.js';
import broadcastRoutes from './routeEventBroadcast.js';

const router = express.Router();
router.use(authenticate);

router.get('/',            listEvents);
router.post('/',           createEvent);
router.get('/:eventId',    getEvent);
router.put('/:eventId',    updateEvent);
router.delete('/:eventId', deleteEvent);

router.use('/:eventId/broadcasts', broadcastRoutes);

export default router;