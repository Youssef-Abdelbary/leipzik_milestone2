import mongoose from 'mongoose';

const recipientSchema = new mongoose.Schema({
  guestId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Guest' },
  fullName:   { type: String, default: '' },
  email:      { type: String, default: '' },
  rsvpStatus: { type: String, default: 'pending' },
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
  totalSent:  { type: Number, default: 0 },
},
  { timestamps: true, collection: 'event_broadcasts' }
);

export default mongoose.model('EventBroadcast', eventBroadcastSchema);