import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    vendorRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorRequest', default: null },
    eventId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
    organizerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vendorId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invoiceNumber:   { type: String, required: true },
    items: [
        {
            description: { type: String, required: true },
            quantity:    { type: Number, required: true },
            unitPrice:   { type: Number, required: true },
            total:       { type: Number, required: true },
        }
    ],
    subtotal:    { type: Number, required: true },
    tax:         { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency:    { type: String, default: "EGP" },
    status:      { type: String, enum: ['pending_review', 'approved', 'rejected', 'paid'], default: 'pending_review' },
    supportingDocuments: [
        {
            fileName:   { type: String, required: true },
            url:        { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now },
        }
    ],
},
    { timestamps: true }
);

export default mongoose.model('Invoice', invoiceSchema, 'vendor_invoices');