import mongoose from 'mongoose';

// Per-recipient delivery + read tracking
const recipientSchema = new mongoose.Schema({
  guestId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Guest' },
  fullName:   { type: String, default: '' },
  email:      { type: String, default: '' },
  rsvpStatus: { type: String, default: 'pending' },

  // Delivery tracking
  deliveryMethod: { type: String, enum: ['email', 'in_app', 'none'], default: 'none' },
  sentAt:         { type: Date, default: null },     // email sent or notification created
  deliveredAt:    { type: Date, default: null },     // future: email webhook
  readAt:         { type: Date, default: null },     // guest opened tracking link / pixel

  // Unique token per recipient so they can mark read without logging in
  // (same pattern as the RSVP token system)
  readToken:      { type: String, default: null },
}, { _id: false });

const eventBroadcastSchema = new mongoose.Schema({
  eventId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Event',  required: true },
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  title:       { type: String, required: true, trim: true },
  message:     { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['announcement', 'reminder', 'followup', 'update'],
    default: 'announcement',
  },
  recipients: [recipientSchema],
  totalSent:      { type: Number, default: 0 },
  totalDelivered: { type: Number, default: 0 },  // emails sent + in-app notifications created
  totalRead:      { type: Number, default: 0 },  // guests who opened/clicked
},
  { timestamps: true, collection: 'event_broadcasts' }
);

export default mongoose.model('EventBroadcast', eventBroadcastSchema);