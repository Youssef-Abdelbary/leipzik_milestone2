import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    venueId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Venue',  required: true },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    date:        { type: Date,   required: true },
    status:      { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
    totalPrice:  { type: Number, required: true },
    currency:    { type: String, default: 'EGP' },
    notes:       { type: String, default: '' },
},
    { timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);