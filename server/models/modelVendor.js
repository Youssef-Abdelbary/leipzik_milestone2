import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    companyName:     { type: String, required: true, trim: true },
    suppliesOffered: { type: [String], default: [] },
    mainLocation: {
        city:    { type: String, default: "" },
        area:    { type: String, default: "" },
        address: { type: String, default: "" },
    },
    pricingList: [
        {
            itemName: { type: String, required: true },
            category: { type: String, default: "" },
            unit:     { type: String, default: "" },
            price:    { type: Number, required: true },
            currency: { type: String, default: "EGP" },
        }
    ],
    contactInfo: {
        contactPerson: { type: String, default: "" },
        phone:         { type: String, default: "" },
        email:         { type: String, default: "" },
    },
    ratingAverage: { type: Number, default: 0 },
    isActive:      { type: Boolean, default: true },
},
    { timestamps: true, collection: "vendor_profiles" }
);

export default mongoose.model('Vendor', vendorSchema);