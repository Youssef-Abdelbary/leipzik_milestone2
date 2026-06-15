import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { sendFeedbackRequests, getFeedbackForm, submitFeedback, getEventFeedbackSummary } from '../controllers/controllerFeedback.js';
import Guest from '../models/modelGuest.js';
import Event from '../models/modelEvent.js';

const router = express.Router();

// Public: get event info for RSVP page
router.get('/rsvp-info/:token', async (req, res) => {
  try {
    const guest = await Guest.findById(req.params.token).lean();
    if (!guest) return res.status(404).json({ error: 'Invalid RSVP link' });
    const event = await Event.findById(guest.eventId).lean();
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({
      eventTitle:  event.title,
      date:        event.date,
      startTime:   event.startTime,
      endTime:     event.endTime,
      venueName:   event.locationSnapshot?.venueName,
      dressCode:   event.dressCode,
      agenda:      event.agenda || [],
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Public
router.get('/form/:token',    getFeedbackForm);
router.post('/submit/:token', submitFeedback);

// Protected — organizer
router.post('/event/:eventId/send',    authenticate, sendFeedbackRequests);
router.get('/event/:eventId/summary',  authenticate, getEventFeedbackSummary);

export default router;