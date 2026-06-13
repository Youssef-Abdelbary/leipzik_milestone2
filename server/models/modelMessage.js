// models/modelMessage.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'BrowseVenue', required: true, index: true },
        sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        receiver:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text:      { type: String, required: true, trim: true, maxlength: 2000 },
        type:      { type: String, enum: ['message', 'counter_proposal'], default: 'message' },
        counterProposal: {
            adjustedPrice:   { type: Number, default: null },
            alternativeDate: { type: Date,   default: null },
            note:            { type: String, trim: true, default: null },
        },
        readAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export default mongoose.model('Message', messageSchema);