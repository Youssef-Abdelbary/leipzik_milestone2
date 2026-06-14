import express from 'express';
import {
    getMyVenues,
    getVenueBookingRequests,
    getBookingById,
    approveBooking,
    declineBooking,
    getMessages,
    sendMessage,
    getVenueAvailability,
} from '../controllers/controllerResponseVenue.js';
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get('/my-venues', getMyVenues);
router.get('/bookings',                          getVenueBookingRequests);
router.get('/bookings/:bookingId',               getBookingById);
router.patch('/bookings/:bookingId/approve',     approveBooking);
router.patch('/bookings/:bookingId/decline',     declineBooking);
router.get('/bookings/:bookingId/messages',      getMessages);
router.post('/bookings/:bookingId/messages',     sendMessage);
router.get('/venues/:venueId/availability',      getVenueAvailability);

export default router;