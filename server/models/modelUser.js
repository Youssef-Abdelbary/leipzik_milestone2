import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    fullname:     { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone:        { type: String, required: true },
    role:         { type: String, required: true, enum: ['vendor', 'venue_owner', 'organizer','staff', 'guest'], default: 'user' },
    status:       { type: String, enum: ['active', 'inactive', 'banned'], default: 'active' },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
},
    { timestamps: true }
);

export default mongoose.model('User', userSchema);