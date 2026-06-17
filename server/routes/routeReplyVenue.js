import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
    getMyVenueReplies,
    getBookingMessages,
    sendBookingMessage,
    sendCounterProposal,
    matchCounterProposal,
    getVenueAvailability,
} from '../controllers/controllerReplyVenue.js';

const router = express.Router();
router.use(authenticate);

function requireOrganizer(req, res, next) {
    if (req.user.role !== 'organizer') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
}

router.get('/', requireOrganizer, getMyVenueReplies);
router.get('/venue/:venueId/availability', requireOrganizer, getVenueAvailability);
router.get('/:bookingId', requireOrganizer, getBookingMessages);
router.post('/:bookingId/message', requireOrganizer, sendBookingMessage);
router.post('/:bookingId/counter', requireOrganizer, sendCounterProposal);
router.post('/:bookingId/match', requireOrganizer, matchCounterProposal);

export default router;