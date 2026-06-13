import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
    getConfirmedBookings,
    getBookingSummary,
    getBookingHistory,
} from '../controllers/controllerManageBookings.js';

const router = express.Router();

router.use(authenticate);

function requireVenueOwner(req, res, next) {
    if (req.user.role !== 'venue_owner') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
}

router.get('/confirmed', authenticate, requireVenueOwner, getConfirmedBookings);
router.get('/summary',   authenticate, requireVenueOwner, getBookingSummary);
router.get('/history',   authenticate, requireVenueOwner, getBookingHistory);

export default router;