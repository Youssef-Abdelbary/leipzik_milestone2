import mongoose from 'mongoose';
import BrowseVenue from '../models/modelBrowseVenue.js';
import Message from '../models/modelMessage.js';
import Venue from '../models/modelVenue.js';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// Resolves who the requesting user is relative to a booking,
// and who the "other side" of the conversation is.
async function getParticipantContext(bookingId, userId) {
    if (!isValidObjectId(bookingId)) {
        return { status: 400, error: 'Invalid booking id' };
    }

    const booking = await BrowseVenue.findById(bookingId)
        .populate('venueId', 'name ownerId')
        .populate('organizerId', 'name email avatar');

    if (!booking) return { status: 404, error: 'Booking not found' };

    const ownerId = booking.venueOwnerId?.toString()
        || booking.venueId?.ownerId?.toString();
    const organizerId = booking.organizerId?._id?.toString()
        || booking.organizerId?.toString();

    const isOwner = ownerId === userId;
    const isOrganizer = organizerId === userId;

    if (!isOwner && !isOrganizer) {
        return { status: 403, error: 'Forbidden' };
    }

    return {
        booking,
        isOwner,
        isOrganizer,
        senderId: userId,
        receiverId: isOwner ? organizerId : ownerId,
    };
}

function normalizeCounterProposal(counterProposal = {}) {
    const adjustedPrice = counterProposal.adjustedPrice;
    const alternativeDates = counterProposal.alternativeDates
        ?? counterProposal.requestedDates
        ?? [];

    return {
        adjustedPrice: adjustedPrice === undefined || adjustedPrice === null
            ? null
            : Number(adjustedPrice),
        currency: counterProposal.currency || 'EGP',
        alternativeDates: alternativeDates.map((date) => new Date(date)),
        note: counterProposal.note?.trim() || null,
        matchedFromMessageId: counterProposal.matchedFromMessageId || null,
    };
}

function validateCounterProposal(counterProposal) {
    if (
        counterProposal.adjustedPrice === null
        && counterProposal.alternativeDates.length === 0
    ) {
        return 'Counter proposal must include adjustedPrice or alternativeDates';
    }

    if (
        counterProposal.adjustedPrice !== null
        && (
            Number.isNaN(counterProposal.adjustedPrice)
            || counterProposal.adjustedPrice < 0
        )
    ) {
        return 'adjustedPrice must be a valid positive number';
    }

    if (counterProposal.alternativeDates.some((date) => Number.isNaN(date.getTime()))) {
        return 'alternativeDates contains an invalid date';
    }

    return null;
}

// Applies a counter proposal's terms onto the BrowseVenue entry itself,
// so the booking record always reflects the latest negotiated terms.
async function applyCounterToBooking(booking, counterProposal) {
    booking.status = 'countered';
    booking.decidedAt = null;

    if (counterProposal.adjustedPrice !== null) {
        booking.proposedPrice = {
            amount: counterProposal.adjustedPrice,
            currency: counterProposal.currency,
        };
    }

    if (counterProposal.alternativeDates.length > 0) {
        booking.requestedDates = counterProposal.alternativeDates;
    }

    if (counterProposal.note) {
        booking.ownerResponseMessage = counterProposal.note;
    }

    await booking.save();
}

/**
 * GET /api/reply-venue
 * Returns every BrowseVenue entry the current user is party to (as organizer
 * or venue owner), each annotated with its messages, incoming messages,
 * and any incoming counter proposals so the UI can render "Match" / "Counter"
 * actions per booking.
 */
export async function getMyVenueReplies(req, res) {
    try {
        const userId = req.user.user_id;

        const bookings = await BrowseVenue.find({
            $or: [
                { organizerId: userId },
                { venueOwnerId: userId },
            ],
        })
            .populate('organizerId', 'name email avatar')
            .populate('venueId', 'name ownerId')
            .sort({ updatedAt: -1 })
            .lean();

        const bookingIds = bookings.map((booking) => booking._id);
        const messages = await Message.find({ bookingId: { $in: bookingIds } })
            .populate('sender', 'name avatar')
            .populate('receiver', 'name avatar')
            .sort({ createdAt: 1 })
            .lean();

        const messagesByBooking = new Map();
        for (const message of messages) {
            const key = message.bookingId.toString();
            const bucket = messagesByBooking.get(key) || [];
            bucket.push(message);
            messagesByBooking.set(key, bucket);
        }

        const replies = bookings.map((booking) => {
            const bookingMessages = messagesByBooking.get(booking._id.toString()) || [];
            const incomingMessages = bookingMessages.filter(
                (message) => message.receiver?._id?.toString() === userId
                    || message.receiver?.toString() === userId
            );

            return {
                ...booking,
                messages: bookingMessages,
                incomingMessages,
                incomingCounterProposals: incomingMessages.filter(
                    (message) => message.type === 'counter_proposal'
                ),
                unreadCount: incomingMessages.filter((message) => !message.readAt).length,
            };
        });

        return res.status(200).json({ replies });
    } catch (err) {
        return res.status(500).json({
            message: 'Failed to fetch venue replies',
            error: err.message,
        });
    }
}

/**
 * GET /api/reply-venue/:bookingId
 * Detail view for a single booking's conversation thread. Marks incoming
 * messages as read.
 */
export async function getBookingMessages(req, res) {
    try {
        const { bookingId } = req.params;
        const context = await getParticipantContext(bookingId, req.user.user_id);

        if (context.error) {
            return res.status(context.status).json({ message: context.error });
        }

        const messages = await Message.find({ bookingId })
            .populate('sender', 'name avatar')
            .populate('receiver', 'name avatar')
            .sort({ createdAt: 1 })
            .lean();

        await Message.updateMany(
            { bookingId, receiver: req.user.user_id, readAt: null },
            { readAt: new Date() }
        );

        const incomingMessages = messages.filter(
            (message) => message.receiver?._id?.toString() === req.user.user_id
                || message.receiver?.toString() === req.user.user_id
        );
        const incomingCounterProposals = incomingMessages.filter(
            (message) => message.type === 'counter_proposal'
        );

        return res.status(200).json({
            booking: context.booking,
            messages,
            incomingMessages,
            incomingCounterProposals,
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Failed to fetch booking messages',
            error: err.message,
        });
    }
}

/**
 * POST /api/reply-venue/:bookingId/message
 * Sends a plain text message on a booking thread (no terms change).
 */
export async function sendBookingMessage(req, res) {
    try {
        const { bookingId } = req.params;
        const { text } = req.body;

        if (!text?.trim()) {
            return res.status(400).json({ message: 'Message text is required' });
        }

        const context = await getParticipantContext(bookingId, req.user.user_id);
        if (context.error) {
            return res.status(context.status).json({ message: context.error });
        }

        const message = await Message.create({
            bookingId,
            sender: context.senderId,
            receiver: context.receiverId,
            text: text.trim(),
            type: 'message',
        });

        await message.populate('sender', 'name avatar');
        await message.populate('receiver', 'name avatar');

        return res.status(201).json({ message });
    } catch (err) {
        return res.status(500).json({
            message: 'Failed to send message',
            error: err.message,
        });
    }
}

/**
 * POST /api/reply-venue/:bookingId/counter
 * Sends a fresh counter proposal (price and/or dates), without needing to
 * have received one first. Updates the BrowseVenue entry's terms directly.
 */
export async function sendCounterProposal(req, res) {
    try {
        const { bookingId } = req.params;
        const { text, counterProposal } = req.body;

        const normalizedCounterProposal = normalizeCounterProposal(counterProposal);
        const validationError = validateCounterProposal(normalizedCounterProposal);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const context = await getParticipantContext(bookingId, req.user.user_id);
        if (context.error) {
            return res.status(context.status).json({ message: context.error });
        }

        await applyCounterToBooking(context.booking, normalizedCounterProposal);

        const message = await Message.create({
            bookingId,
            sender: context.senderId,
            receiver: context.receiverId,
            text: text?.trim()
                || normalizedCounterProposal.note
                || 'Counter proposal sent',
            type: 'counter_proposal',
            counterProposal: normalizedCounterProposal,
        });

        await message.populate('sender', 'name avatar');
        await message.populate('receiver', 'name avatar');

        return res.status(201).json({
            message,
            booking: context.booking,
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Failed to send counter proposal',
            error: err.message,
        });
    }
}

/**
 * POST /api/reply-venue/:bookingId/match
 * Accepts (matches) an incoming counter proposal by re-sending its exact
 * terms back as your own counter proposal — both sides land on the same
 * price/dates, and the booking's terms are applied accordingly.
 * If messageId is omitted, matches the most recent incoming counter proposal.
 */
export async function matchCounterProposal(req, res) {
    try {
        const { bookingId } = req.params;
        const { messageId, text } = req.body;

        const context = await getParticipantContext(bookingId, req.user.user_id);
        if (context.error) {
            return res.status(context.status).json({ message: context.error });
        }

        const counterMessage = messageId
            ? await Message.findOne({
                _id: messageId,
                bookingId,
                receiver: req.user.user_id,
                type: 'counter_proposal',
            })
            : await Message.findOne({
                bookingId,
                receiver: req.user.user_id,
                type: 'counter_proposal',
            }).sort({ createdAt: -1 });

        if (!counterMessage) {
            return res.status(404).json({
                message: 'No incoming counter proposal found to match',
            });
        }

        const matchedCounterProposal = normalizeCounterProposal({
            ...counterMessage.counterProposal?.toObject?.()
                ?? counterMessage.counterProposal
                ?? {},
            matchedFromMessageId: counterMessage._id,
        });

        const validationError = validateCounterProposal(matchedCounterProposal);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        await applyCounterToBooking(context.booking, matchedCounterProposal);

        const message = await Message.create({
            bookingId,
            sender: context.senderId,
            receiver: context.receiverId,
            text: text?.trim() || 'I matched your counter proposal',
            type: 'counter_proposal',
            counterProposal: matchedCounterProposal,
        });

        await message.populate('sender', 'name avatar');
        await message.populate('receiver', 'name avatar');

        return res.status(201).json({
            message,
            matchedMessageId: counterMessage._id,
            booking: context.booking,
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Failed to match counter proposal',
            error: err.message,
        });
    }
}

/**
 * GET /api/reply-venue/venue/:venueId/availability
 * Returns the venue's blocked/booked dates so the calendar UI can highlight
 * them. Each date is tagged with a `source`: 'booking' if it's tied to an
 * approved BrowseVenue entry, or 'manual' if the owner blocked it directly
 * on the venue (no associated bookingId).
 */
export async function getVenueAvailability(req, res) {
    try {
        const { venueId } = req.params;

        if (!isValidObjectId(venueId)) {
            return res.status(400).json({ message: 'Invalid venue id' });
        }

        const venue = await Venue.findById(venueId).select('name bookedDates').lean();
        if (!venue) return res.status(404).json({ message: 'Venue not found' });

        const toDateStr = (value) => {
            const dt = new Date(value);
            const y  = dt.getUTCFullYear();
            const m  = String(dt.getUTCMonth() + 1).padStart(2, '0');
            const d  = String(dt.getUTCDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const seen   = new Set();
        const merged = [];

        // ── 1. Dates from venue.bookedDates ─────────────────────────────────────
        // No bookingId attached = manually blocked by the owner.
        for (const entry of venue.bookedDates ?? []) {
            const key = toDateStr(entry.date);
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push({
                date:      key,
                bookingId: entry.bookingId ?? null,
                source:    entry.bookingId ? 'booking' : 'manual',
            });
        }

        // ── 2. Approved BrowseVenue bookings ────────────────────────────────────
        const approvedBookings = await BrowseVenue.find({ venueId, status: 'approved' })
            .select('requestedDates')
            .lean();

        for (const booking of approvedBookings) {
            for (const date of booking.requestedDates ?? []) {
                const key = toDateStr(date);
                if (seen.has(key)) continue;   // venue.bookedDates already has it
                seen.add(key);
                merged.push({
                    date:      key,
                    bookingId: booking._id,
                    source:    'booking',
                });
            }
        }

        return res.status(200).json({
            venueId,
            venueName:   venue.name,
            bookedDates: merged,   // [{ date, bookingId, source: 'booking'|'manual' }]
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Failed to fetch venue availability',
            error: err.message,
        });
    }
}