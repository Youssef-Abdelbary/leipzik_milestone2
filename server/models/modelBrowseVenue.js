import mongoose from 'mongoose';

const browseVenueSchema = new mongoose.Schema({
    organizerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    venueId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    venueOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },

    eventType: { type: String, required: true, trim: true },

    requestedDate: { type: Date, required: true },

    expectedAttendees: { type: Number },

    specialRequirements: { type: String, trim: true },

    status: {
        type: String,
        enum: ['pending', 'approved', 'declined', 'countered'],
        default: 'pending',
    },

    proposedPrice: {
        amount:   { type: Number },
        currency: { type: String, default: 'EGP' },
    },

    ownerResponseMessage: { type: String, trim: true },
    decidedAt:            { type: Date },
},
    { timestamps: true }
);

export default mongoose.model('BrowseVenue', browseVenueSchema, 'venue_booking_requests');