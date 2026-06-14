import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  eventId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  guestId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', required: true },
  token:      { type: String, required: true, unique: true },
  experience: { type: Number, min: 1, max: 5, default: null },
  food:       { type: Number, min: 1, max: 5, default: null },
  venue:      { type: Number, min: 1, max: 5, default: null },
  organisation: { type: Number, min: 1, max: 5, default: null },
  comments:   { type: String, trim: true, default: '' },
  submittedAt:{ type: Date, default: null },
}, { timestamps: true, collection: 'event_feedback' });

export default mongoose.model('Feedback', feedbackSchema);