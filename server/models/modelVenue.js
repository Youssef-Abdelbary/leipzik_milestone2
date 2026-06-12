import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
    ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    location: {
        city:    { type: String, required: true },
        area:    { type: String },
        address: { type: String },
    },

    capacity:      { type: Number, required: true },
    dimensionsSqm: { type: Number },

    amenities: [{ type: String }],

    pricing: {
        basePrice:   { type: Number, required: true },
        currency:    { type: String, default: 'EGP' },
        pricingUnit: { type: String, enum: ['per_event', 'per_hour', 'per_day'], default: 'per_event' },
    },

    photos: [{
        url:     { type: String, required: true },
        caption: { type: String, default: '' },
        _id:     false,
    }],

    floorPlans: [{
        url:   { type: String, required: true },
        label: { type: String, default: '' },
        _id:   false,
    }],

    bookedDates: [{
        date:      { type: Date, required: true },
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
        _id:       false,
    }],

    isActive:  { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
},
    { timestamps: true }
);

export default mongoose.model('Venue', venueSchema);