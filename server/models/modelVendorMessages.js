// models/modelVendorMessages.js
import mongoose from 'mongoose';

const vendorMessageSchema = new mongoose.Schema(
    {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VendorRequest',
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        type: {
            type: String,
            enum: ['message', 'clarification'],
            default: 'message',
        },
        readAt: { type: Date, default: null },
    },
    { timestamps: true }
);

vendorMessageSchema.index({ requestId: 1, createdAt: 1 });

export default mongoose.model('VendorMessage', vendorMessageSchema);