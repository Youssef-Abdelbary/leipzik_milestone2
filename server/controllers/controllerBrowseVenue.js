import Venue from '../models/modelVenue.js';
import Booking from '../models/modelBooking.js';
import BrowseVenue from '../models/modelBrowseVenue.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import { Readable } from 'stream';

// ─── 1. Get All Listings (browse) ────────────────────────────────────────────

export async function searchVenues(req, res) {
    try {
        const { search } = req.query;

        const filter = {
            isDeleted: false,
            isActive:  true,
        };

        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        const venues = await Venue.find(filter)
            .limit(10)
            .lean();

        return res.status(200).json({ venues });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch venues', error: err.message });
    }
}

// ─── 2. Send a Booking Request ────────────────────────────────────────────────

export async function requestBooking(req, res) {
    try {
        const {
            eventType,
            requestedDate,
            expectedAttendees,
            specialRequirements,
            proposedAmount,
            proposedCurrency,
        } = req.body;

        const venue = await Venue.findOne({
            _id:       req.params.id,
            isDeleted: false,
            isActive:  true,
        });

        if (!venue) return res.status(404).json({ message: 'Venue not found' });

        const bookingRequest = await BrowseVenue.create({
            organizerId:  req.user.user_id,
            venueId:      venue._id,
            venueOwnerId: venue.ownerId,

            eventType,
            requestedDate: new Date(requestedDate),
            expectedAttendees,
            specialRequirements,

            proposedPrice: {
                amount:   proposedAmount   ?? venue.pricing.basePrice,
                currency: proposedCurrency ?? venue.pricing.currency,
            },

            status: 'pending',
        });

        return res.status(201).json({ message: 'Booking request sent', bookingRequest });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to send booking request', error: err.message });
    }
}