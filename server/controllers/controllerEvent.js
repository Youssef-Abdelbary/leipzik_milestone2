import Event from '../models/modelEvent.js';
import Guest from '../models/modelGuest.js';

export const listEvents = async (req, res) => {
  try {
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Only organizers can manage events' });
    }
    const events = await Event.find({ organizerId: req.user.user_id })
      .lean()
      .sort({ date: 1, createdAt: -1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

export const createEvent = async (req, res) => {
  try {
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Only organizers can create events' });
    }
    const {
      title, description, date, startTime, endTime,
      eventType, expectedAttendees, location, dressCode,
    } = req.body;

    if (!title?.trim())  return res.status(400).json({ message: 'Title is required' });
    if (!eventType)      return res.status(400).json({ message: 'Event type is required' });
    if (!date)           return res.status(400).json({ message: 'Date is required' });
    if (!startTime)      return res.status(400).json({ message: 'Start time is required' });

    const event = await Event.create({
      title:          title.trim(),
      description:    description?.trim() || '',
      date:           new Date(date),
      startTime,
      endTime:        endTime || '',
      eventType,
      locationSnapshot: {
        venueName: location?.trim() || 'TBD',
        city:      'TBD',
      },
      expectedAttendees: expectedAttendees ? Number(expectedAttendees) : 0,
      dressCode:      dressCode?.trim() || '',
      organizerId:    req.user.user_id,
      status:         'planning', // always planning on create
    });
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
};

export const getEvent = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id:         req.params.eventId,
      organizerId: req.user.user_id,
    }).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Only organizers can update events' });
    }
    const event = await Event.findOne({
      _id:         req.params.eventId,
      organizerId: req.user.user_id,
    });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const {
      title, description, date, startTime, endTime,
      eventType, expectedAttendees, location, dressCode, status,
    } = req.body;

    const prevStatus = event.status;

    if (title?.trim())                   event.title             = title.trim();
    if (description !== undefined)       event.description       = description.trim();
    if (date)                            event.date              = new Date(date);
    if (startTime)                       event.startTime         = startTime;
    if (endTime !== undefined)           event.endTime           = endTime;
    if (eventType)                       event.eventType         = eventType;
    if (expectedAttendees !== undefined) event.expectedAttendees = Number(expectedAttendees) || 0;
    if (dressCode !== undefined)         event.dressCode         = dressCode.trim();
    if (status)                          event.status            = status;
    if (location !== undefined) {
      event.locationSnapshot = {
        ...(event.locationSnapshot?.toObject ? event.locationSnapshot.toObject() : event.locationSnapshot),
        venueName: location?.trim() || 'TBD',
      };
    }

    await event.save();

    // Auto-trigger feedback emails when marked completed
    if (status === 'completed' && prevStatus !== 'completed') {
      try {
        const { sendFeedbackRequests: triggerFeedback } = await import('./controllerFeedback.js');
        // Fire-and-forget: don't block the response
        Guest.find({ eventId: event._id, 'rsvp.status': 'attending' }).lean().then(async (guests) => {
          const crypto = await import('crypto');
          const Feedback = (await import('../models/modelFeedback.js')).default;
          const { sendFeedbackRequestEmail, isEmailConfigured } = await import('../utils/emailUtil.js');

          for (const guest of guests) {
            const existing = await Feedback.findOne({ eventId: event._id, guestId: guest._id });
            if (existing) continue;
            const token = crypto.default.randomBytes(24).toString('hex');
            await Feedback.create({ eventId: event._id, guestId: guest._id, token });
            if (guest.email && isEmailConfigured()) {
              const feedbackUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/guest/feedback/${token}`;
              sendFeedbackRequestEmail({ to: guest.email, guestName: guest.fullName, eventTitle: event.title, feedbackUrl }).catch(console.error);
            }
          }
        }).catch(console.error);
      } catch (e) {
        console.error('Feedback trigger error:', e.message);
      }
    }

    res.json(event.toObject());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update event', error: err.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Only organizers can delete events' });
    }
    const event = await Event.findOneAndDelete({
      _id:         req.params.eventId,
      organizerId: req.user.user_id,
    });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};