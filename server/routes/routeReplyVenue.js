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

function requireOrganizer(req, res, next) {
    if (req.user.role !== 'organizer') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
}

const router = express.Router();

router.use(authenticate);
router.get('/', getMyVenueReplies);
router.get('/venue/:venueId/availability', getVenueAvailability);
router.get('/:bookingId', getBookingMessages);
router.post('/:bookingId/message', sendBookingMessage);
router.post('/:bookingId/counter', sendCounterProposal);
router.post('/:bookingId/match', matchCounterProposal);
export default router;