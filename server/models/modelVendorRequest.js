import mongoose from 'mongoose';

const vendorRequestSchema = new mongoose.Schema({
    eventId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    
    requestedItems: [
        {
            itemName: { type: String, required: true },
            quantity: { type: Number, required: true },
            unit:     { type: String, required: true },
            notes:    { type: String, default: null },
        }
    ],

    deliveryDate: { type: Date, required: true },

    deliveryLocation: {
        venueName: { type: String, required: true },
        address:   { type: String, required: true },
    },

    organizerContactSnapshot: {
        name:  { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
    },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending',
    },

    vendorResponse: {
        message:     { type: String, default: null },
        respondedAt: { type: Date, default: null },
    },

    delivery: {
        status: {
            type: String,
            enum: ['preparing', 'out_for_delivery', 'delivered'],
            default: null,
        },
        estimatedArrivalTime: { type: Date, default: null },
    },

    clarificationMessages: [
        {
            senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
            message:  { type: String, required: true },
            sentAt:   { type: Date, default: Date.now },
        }
    ],
},
    { timestamps: true, collection: "vendor_requests" }
);

export default mongoose.model('VendorRequest', vendorRequestSchema);