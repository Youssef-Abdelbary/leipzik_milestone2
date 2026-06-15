import crypto from 'crypto';
import Feedback from '../models/modelFeedback.js';
import Guest from '../models/modelGuest.js';
import Event from '../models/modelEvent.js';
import { sendFeedbackRequestEmail } from '../utils/emailUtil.js';

// Called when event is marked completed — send feedback emails to all attending guests
export const sendFeedbackRequests = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findOne({ _id: eventId, organizerId: req.user.user_id }).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'completed') return res.status(400).json({ message: 'Event must be completed' });

    const guests = await Guest.find({
      eventId,
      'rsvp.status': 'attending',
    }).lean();

    let sent = 0;
    for (const guest of guests) {
      // Upsert: don't send twice
      const existing = await Feedback.findOne({ eventId, guestId: guest._id });
      if (existing) continue;

      const token = crypto.randomBytes(24).toString('hex');
      await Feedback.create({ eventId, guestId: guest._id, token });

      if (guest.email) {
        try {
          const feedbackUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/guest/feedback/${token}`;
          await sendFeedbackRequestEmail({
            to: guest.email,
            guestName: guest.fullName,
            eventTitle: event.title,
            feedbackUrl,
          });
          sent++;
        } catch (e) {
          console.error('Failed to send feedback email:', e.message);
        }
      }
    }

    res.json({ message: `Feedback requests sent to ${sent} guest(s)`, total: guests.length, sent });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send feedback requests', error: err.message });
  }
};

// Public: get event info + guest name for feedback form
export const getFeedbackForm = async (req, res) => {
  try {
    const { token } = req.params;
    const feedback = await Feedback.findOne({ token }).lean();
    if (!feedback) return res.status(404).json({ message: 'Invalid feedback link' });

    const [event, guest] = await Promise.all([
      Event.findById(feedback.eventId).lean(),
      Guest.findById(feedback.guestId).lean(),
    ]);

    res.json({
      alreadySubmitted: Boolean(feedback.submittedAt),
      eventTitle: event?.title,
      guestName: guest?.fullName,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Public: submit feedback
export const submitFeedback = async (req, res) => {
  try {
    const { token } = req.params;
    const { experience, food, venue, organisation, comments } = req.body;

    const feedback = await Feedback.findOne({ token });
    if (!feedback) return res.status(404).json({ message: 'Invalid feedback link' });
    if (feedback.submittedAt) return res.status(400).json({ message: 'Feedback already submitted' });

    feedback.experience   = experience;
    feedback.food         = food;
    feedback.venue        = venue;
    feedback.organisation = organisation;
    feedback.comments     = comments || '';
    feedback.submittedAt  = new Date();
    await feedback.save();

    res.json({ message: 'Thank you for your feedback!' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};


// GET /api/feedback/event/:eventId/summary — organizer only
export const getEventFeedbackSummary = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({ _id: eventId, organizerId: req.user.user_id }).lean();
    if (!event) return res.status(404).json({ message: 'Event not found or access denied' });

    const feedbacks = await Feedback.find({ eventId, submittedAt: { $ne: null } }).lean();

    if (feedbacks.length === 0) {
      return res.json({ count: 0, averages: null, distribution: null, comments: [], total: 0 });
    }

    const CATS = ['experience', 'food', 'venue', 'organisation'];
    const averages = {};
    CATS.forEach(cat => {
      const vals = feedbacks.map(f => f[cat]).filter(v => v !== null && v !== undefined);
      averages[cat] = vals.length
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
        : null;
    });

    const allVals = Object.values(averages).filter(v => v !== null);
    averages.overall = allVals.length
      ? Math.round((allVals.reduce((a, b) => a + b, 0) / allVals.length) * 10) / 10
      : null;

    // Star distribution for "experience"
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    feedbacks.forEach(f => {
      if (f.experience >= 1 && f.experience <= 5) distribution[f.experience]++;
    });

    const comments = feedbacks
      .filter(f => f.comments?.trim())
      .map(f => ({ comment: f.comments, submittedAt: f.submittedAt }))
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 30);

    // Count attending guests for response rate
    const Guest = (await import('../models/modelGuest.js')).default;
    const attendingCount = await Guest.countDocuments({ eventId, 'rsvp.status': 'attending' });

    res.json({
      count: feedbacks.length,
      total: attendingCount,
      averages,
      distribution,
      comments,
    });
  } catch (err) {
    console.error('getEventFeedbackSummary error:', err);
    res.status(500).json({ message: 'Failed to fetch feedback summary' });
  }
};