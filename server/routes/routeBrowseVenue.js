import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
    searchVenues,
    requestBooking,
} from '../controllers/controllerBrowseVenue.js';

const router = express.Router();

function requireOrganizer(req, res, next) {
    if (req.user.role !== 'organizer') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
}

router.get('/', authenticate, requireOrganizer, searchVenues);
router.post('/:id', authenticate, requireOrganizer, requestBooking);

export default router;