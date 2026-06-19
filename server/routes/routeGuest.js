import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';
import {
  listGuests, addGuest, updateGuest, deleteGuest,
  sendInvitation, submitRsvp, checkInByQR,
} from '../controllers/controllerGuest.js';

const router = express.Router();

// ─── Public (no auth) ────────────────────────────────────────────────────────
// Token = guest._id used as RSVP token
router.post('/guest/rsvp/:token', submitRsvp);

// ─── Staff / organizer: QR check-in ──────────────────────────────────────────
router.patch('/guests/checkin/qr', authenticate, requireRoles('staff', 'organizer'), checkInByQR);

// ─── Organizer: guest management ─────────────────────────────────────────────
router.get('/events/:eventId/guests',                   authenticate, requireRoles('organizer'), listGuests);
router.post('/events/:eventId/guests',                  authenticate, requireRoles('organizer'), addGuest);
router.put('/events/:eventId/guests/:guestId',          authenticate, requireRoles('organizer'), updateGuest);
router.delete('/events/:eventId/guests/:guestId',       authenticate, requireRoles('organizer'), deleteGuest);
router.post('/events/:eventId/guests/:guestId/invite',  authenticate, requireRoles('organizer'), sendInvitation);

export default router;