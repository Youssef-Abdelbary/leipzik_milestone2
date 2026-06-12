import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
    upload,
    getMyVenues,
    getVenueById,
    createVenue,
    updateVenue,
    deleteVenue,
    bookDate,
    cancelBooking,
} from '../controllers/controllerVenue.js';

const router = express.Router();

function requireVenueOwner(req, res, next) {
    if (req.user.role !== 'venue_owner') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
}

router.get('/',                             authenticate, requireVenueOwner, getMyVenues);
router.get('/:id',                          authenticate, requireVenueOwner, getVenueById);
router.post('/',                            authenticate, requireVenueOwner, upload.array('photos', 10), createVenue);
router.put('/:id',                          authenticate, requireVenueOwner, upload.array('photos', 10), updateVenue);
router.delete('/:id',                       authenticate, requireVenueOwner, deleteVenue);
router.post('/:id/book',                    authenticate, bookDate);
router.patch('/bookings/:bookingId/cancel', authenticate, cancelBooking);

export default router;