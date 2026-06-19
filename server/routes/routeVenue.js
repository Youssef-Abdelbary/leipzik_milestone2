import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';
import {
    upload,
    getMyVenues,
    getVenueById,
    createVenue,
    updateVenue,
    deleteVenue,
    bookDate,
    cancelBooking,
    getNotifications,
    markNotificationsRead,
    deactivateVenue,
    activateVenue,
} from '../controllers/controllerVenue.js';

const router = express.Router();

function requireVenueOwner(req, res, next) {
    if (req.user.role !== 'venue_owner') {
        return res.status(403).json({ message: 'Access denied' });
    }
    next();
}

// 1. Specific static paths go FIRST
router.get('/notifications',                     authenticate, getNotifications);
router.patch('/notifications/read',              authenticate, markNotificationsRead);

// 2. Dynamic wildcard paths go LATER
router.get('/',                             authenticate, requireVenueOwner, getMyVenues);
router.get('/:id',                          authenticate, requireVenueOwner, getVenueById);
router.post('/',                            authenticate, requireVenueOwner, upload.array('photos', 10), createVenue);
router.put("/:id", authenticate, requireVenueOwner, upload.array("photos"), updateVenue);
router.patch("/:id/deactivate", authenticate, requireVenueOwner, deactivateVenue);
router.patch("/:id/activate", authenticate, requireVenueOwner, activateVenue);
router.delete('/:id',                       authenticate, requireVenueOwner, deleteVenue);
router.post('/:id/book',                    authenticate, requireRoles('organizer'), bookDate);
router.patch('/bookings/:bookingId/cancel', authenticate, requireRoles('organizer'), cancelBooking);

export default router;