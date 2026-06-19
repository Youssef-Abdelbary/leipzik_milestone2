import Venue from '../models/modelVenue.js';
import BrowseVenue from '../models/modelBrowseVenue.js';
import Notification from '../models/modelNotification.js';
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
            const pattern = { $regex: search, $options: 'i' };
            filter.$or = [
                { name: pattern },
                { 'location.city': pattern },
                { 'location.area': pattern },
            ];
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
            eventId,
            eventType,
            requestedDates,
            expectedAttendees,
            specialRequirements,
            proposedAmount,
            proposedCurrency,
        } = req.body;

        if (!Array.isArray(requestedDates) || requestedDates.length === 0) {
            return res.status(400).json({ message: 'At least one date is required' });
        }

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
            eventId:      eventId ?? null,

            eventType,
            requestedDates: requestedDates.map(d => new Date(d + 'T00:00:00.000Z')),
            expectedAttendees,
            specialRequirements,

            proposedPrice: {
                amount:   proposedAmount   ?? venue.pricing.basePrice,
                currency: proposedCurrency ?? venue.pricing.currency,
            },

            status: 'pending',
        });

        const dateLabel = requestedDates.length === 1
            ? new Date(requestedDates[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : `${requestedDates.length} dates`;

        await Notification.create({
            userId:            venue.ownerId,
            type:              'booking_request',
            title:             'Booking Request',
            message:           `New ${eventType} at ${venue.name}.`,
            relatedEntityType: 'BrowseVenue',
            relatedEntityId:   bookingRequest._id,
            status:            'unread',
        });

        return res.status(201).json({ message: 'Booking request sent', bookingRequest });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to send booking request', error: err.message });
    }
}