import Venue from '../models/modelVenue.js';
import BrowseVenue from '../models/modelBrowseVenue.js';
import Message from '../models/modelMessage.js';

// ─── Bookings for venue owner ────────────────────────────────────────────────

export async function getVenueBookingRequests(req, res) {
    try {
        const venues = await Venue.find({ ownerId: req.user.user_id, isDeleted: false }).select('_id').lean();
        const venueIds = venues.map(v => v._id);
        const bookings = await BrowseVenue.find({ venueId: { $in: venueIds } })
            .populate('organizerId', 'name email avatar')
            .populate('venueId', 'name')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({ bookings });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch booking requests', error: err.message });
    }
}

export async function getBookingById(req, res) {
    try {
        const booking = await BrowseVenue.findById(req.params.bookingId)
            .populate('organizerId', 'name email avatar')
            .populate('venueId', 'name ownerId')
            .lean();

        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const isOwner = booking.venueId.ownerId.toString() === req.user.user_id;
        const isOrganizer = booking.organizerId._id.toString() === req.user.user_id;
        if (!isOwner && !isOrganizer) return res.status(403).json({ message: 'Forbidden' });

        return res.status(200).json({ booking });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch booking', error: err.message });
    }
}

// ─── Approve / Decline ───────────────────────────────────────────────────────

export async function approveBooking(req, res) {
    try {
        const booking = await BrowseVenue.findById(req.params.bookingId).populate('venueId', 'ownerId name bookedDates');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.venueId.ownerId.toString() !== req.user.user_id)
            return res.status(403).json({ message: 'Only the venue owner can approve bookings' });

        if (booking.status !== 'pending')
            return res.status(400).json({ message: `Booking is already ${booking.status}` });

        booking.status = 'approved';
        booking.decidedAt = new Date();  // was: respondedAt
        await booking.save();

        // ─── Lock out the requested dates on the venue's availability calendar ───
        const existingDates = new Set(
            (booking.venueId.bookedDates || []).map(b => new Date(b.date).toDateString())
        );

        const newBookedDates = (booking.requestedDates || [])
            .filter(date => !existingDates.has(new Date(date).toDateString()))
            .map(date => ({
                date,
                bookingId: booking._id,
            }));

        if (newBookedDates.length > 0) {
            await Venue.findByIdAndUpdate(booking.venueId._id, {
                $push: { bookedDates: { $each: newBookedDates } },
            });
        }

        const venueName = booking.venueId.name;

        return res.status(200).json({
            message: 'Booking approved',
            booking: {
                ...booking.toObject(),
                venueName,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to approve booking', error: err.message });
    }
}

export async function declineBooking(req, res) {
    try {
        const booking = await BrowseVenue.findById(req.params.bookingId).populate('venueId', 'ownerId name');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.venueId.ownerId.toString() !== req.user.user_id)
            return res.status(403).json({ message: 'Only the venue owner can decline bookings' });

        if (booking.status !== 'pending')
            return res.status(400).json({ message: `Booking is already ${booking.status}` });

        const { reason } = req.body;
        booking.status = 'declined';
        booking.ownerResponseMessage = reason || null;  // was: declineReason
        booking.decidedAt = new Date();                 // was: respondedAt
        await booking.save();

        const venueName = booking.venueId.name;

        return res.status(200).json({
            message: 'Booking declined',
            booking: {
                ...booking.toObject(),
                venueName,
            },
        });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to decline booking', error: err.message });
    }
}

// ─── Venue availability ──────────────────────────────────────────────────────

// Returns the dates that are locked out for this venue (from approved
// bookings). The frontend overlays the *current* booking's own requested
// dates on top of this, so we don't need to fetch other bookings here.
export async function getVenueAvailability(req, res) {
    try {
        const { venueId } = req.params;

        const venue = await Venue.findById(venueId).select('name bookedDates').lean();
        if (!venue) return res.status(404).json({ message: 'Venue not found' });

        const bookedDates = (venue.bookedDates || []).map(b => ({
            date: b.date,
            bookingId: b.bookingId,
        }));

        return res.status(200).json({
            venueId,
            venueName: venue.name,
            bookedDates,
        });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch venue availability', error: err.message });
    }
}

// ─── Messages / Counter-proposals ───────────────────────────────────────────

export async function getMessages(req, res) {
    try {
        const { bookingId } = req.params;

        const booking = await BrowseVenue.findById(bookingId).populate('venueId', 'ownerId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const isOwner = booking.venueId.ownerId.toString() === req.user.user_id;
        const isOrganizer = booking.organizerId.toString() === req.user.user_id;
        if (!isOwner && !isOrganizer) return res.status(403).json({ message: 'Forbidden' });

        const messages = await Message.find({ bookingId })
            .populate('sender', 'name avatar')
            .sort({ createdAt: 1 })
            .lean();

        await Message.updateMany(
            { bookingId, receiver: req.user.user_id, readAt: null },
            { readAt: new Date() }
        );

        return res.status(200).json({ messages });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch messages', error: err.message });
    }
}

export async function sendMessage(req, res) {
    try {
        const { bookingId } = req.params;
        const { text, type = 'message', counterProposal } = req.body;

        if (!text?.trim()) return res.status(400).json({ message: 'Message text is required' });

        const booking = await BrowseVenue.findById(bookingId).populate('venueId', 'ownerId');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const senderId = req.user.user_id;
        const isOwner = booking.venueId.ownerId.toString() === senderId;
        const isOrganizer = booking.organizerId.toString() === senderId;
        if (!isOwner && !isOrganizer) return res.status(403).json({ message: 'Forbidden' });

        const receiverId = isOwner
            ? booking.organizerId.toString()
            : booking.venueId.ownerId.toString();

        const message = await Message.create({
            bookingId,
            sender: senderId,
            receiver: receiverId,
            text: text.trim(),
            type,
            counterProposal: type === 'counter_proposal' ? counterProposal : undefined,
        });

        await message.populate('sender', 'name avatar');

        return res.status(201).json({ message });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to send message', error: err.message });
    }
}

// ─── My venues ────────────────────────────────────────────────────────────────

export async function getMyVenues(req, res) {
    try {
        const venues = await Venue.find({ ownerId: req.user.user_id, isDeleted: false }).lean();
        return res.status(200).json({ venues });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to fetch venues', error: err.message });
    }
}