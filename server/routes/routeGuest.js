import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  listGuests, addGuest, updateGuest, deleteGuest,
  sendInvitation, submitRsvp,
} from '../controllers/controllerGuest.js';

const router = express.Router();

// Public — no auth
router.post('/rsvp/:token', submitRsvp);

// Protected — organizer only
router.get('/events/:eventId/guests',                        authenticate, listGuests);
router.post('/events/:eventId/guests',                       authenticate, addGuest);
router.put('/events/:eventId/guests/:guestId',               authenticate, updateGuest);
router.delete('/events/:eventId/guests/:guestId',            authenticate, deleteGuest);
router.post('/events/:eventId/guests/:guestId/invite',       authenticate, sendInvitation);

export default router;