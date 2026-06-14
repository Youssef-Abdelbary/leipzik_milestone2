import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  listGuests, addGuest, updateGuest, deleteGuest,
  sendInvitation, submitRsvp, checkInByQR,
} from '../controllers/controllerGuest.js';

const router = express.Router();

// ─── Public (no auth) ────────────────────────────────────────────────────────
// Token = guest._id used as RSVP token
router.post('/guest/rsvp/:token', submitRsvp);

// ─── Staff / Organizer: QR check-in ─────────────────────────────────────────
// Requires authentication (staff or organizer)
router.patch('/guests/checkin/qr', authenticate, checkInByQR);

// ─── Organizer: guest management ─────────────────────────────────────────────
router.get('/events/:eventId/guests',                   authenticate, listGuests);
router.post('/events/:eventId/guests',                  authenticate, addGuest);
router.put('/events/:eventId/guests/:guestId',          authenticate, updateGuest);
router.delete('/events/:eventId/guests/:guestId',       authenticate, deleteGuest);
router.post('/events/:eventId/guests/:guestId/invite',  authenticate, sendInvitation);

export default router;