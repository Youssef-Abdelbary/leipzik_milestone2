import Event from '../models/modelEvent.js';

export const listEvents = async (req, res) => {
  try {
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ message: 'Only organizers can manage events' });
    }
    const events = await Event.find({ organizerId: req.user.user_id })
      .lean()
      .sort({ createdAt: -1 });
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
    const { title, description, date, location, eventType, startTime } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

    const event = await Event.create({
      title,
      description,
      date: date || new Date(),
      startTime: startTime || '00:00',
      eventType: eventType || 'pop-up',
      locationSnapshot: {
        venueName: location || 'TBD',
        city: 'TBD',
      },
      organizerId: req.user.user_id,
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
      _id: req.params.eventId,
      organizerId: req.user.user_id,
    }).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch event' });
  }
};