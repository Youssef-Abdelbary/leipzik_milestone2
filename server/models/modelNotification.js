import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:              { type: String, required: true },
    title:             { type: String, required: true },
    message:           { type: String, required: true },
    relatedEntityType: { type: String, default: null },
    relatedEntityId:   { type: mongoose.Schema.Types.ObjectId, default: null },
    status:            { type: String, enum: ['unread', 'read'], default: 'unread' },
    scheduledFor:      { type: Date, default: null },
},
    { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);