import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    organizerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    title: { 
        type: String, 
        required: true, 
        trim: true 
    },
    description: { 
        type: String, 
        trim: true 
    },
    eventType: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['planning','confirmed'], 
        default: 'planning' 
    },
    date: { 
        type: Date, 
        required: true 
    },
    startTime: { 
        type: String, // Stored as "HH:MM"
        required: true 
    },
    endTime: { 
        type: String // Stored as "HH:MM"
    },
    venueId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Venue', 
        default: null 
    },
    venueBookingRequestId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'VenueBookingRequest', 
        default: null 
    },
    locationSnapshot: {
        venueName: { type: String, required: true },
        city: { type: String, required: true },
        area: { type: String },
        address: { type: String }
    },
    expectedAttendees: { 
        type: Number, 
        default: 0 
    },
    dressCode: { 
        type: String 
    },
    agenda: [{
        time: { type: String, required: true }, // "HH:MM"
        title: { type: String, required: true },
        description: { type: String }
    }],
    budget: {
        plannedTotal: { type: Number, default: 0 },
        currency: { type: String, default: 'EGP' },
        plannedBreakdown: [{
            category: { type: String, required: true },
            plannedAmount: { type: Number, required: true, default: 0 }
        }]
    },
    dashboardStats: {
        totalGuests: { type: Number, default: 0 },
        checkedInGuests: { type: Number, default: 0 },
        averagePositiveFeedback: { type: Number, default: 0 },
        averageNegativeFeedback: { type: Number, default: 0 },
        totalActualExpenses: { type: Number, default: 0 }
    }
}, 
    { 
        timestamps: true, // Automatically handles createdAt and updatedAt
        collection: 'events' 
    }
);

export default mongoose.models.Event || mongoose.model('Event', eventSchema);