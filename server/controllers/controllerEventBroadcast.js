import EventBroadcast from '../models/modelEventBroadcast.js';
import Guest from '../models/modelGuest.js';
import Event from '../models/modelEvent.js';
import { createNotification } from '../utils/notificationUtil.js';

export const sendBroadcast = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, message, type = 'announcement', rsvpFilter = 'all' } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const event = await Event.findOne({ _id: eventId, organizerId: req.user.user_id }).lean();
    if (!event) return res.status(404).json({ message: 'Event not found or access denied' });

    const guestFilter = { eventId };
    if (rsvpFilter !== 'all') {
      guestFilter['rsvp.status'] = rsvpFilter;
    }

    const guests = await Guest.find(guestFilter).lean();

    const recipients = guests.map(g => ({
      guestId:    g._id,
      fullName:   g.fullName || '',
      email:      g.email || '',
      rsvpStatus: g.rsvp?.status || 'pending',
    }));

    const broadcast = await EventBroadcast.create({
      eventId,
      organizerId: req.user.user_id,
      title: title.trim(),
      message: message.trim(),
      type,
      recipients,
      totalSent: recipients.length,
    });

    let notifiedCount = 0;
    for (const guest of guests) {
      if (guest.userId) {
        await createNotification({
          userId:            guest.userId,
          type:              'day_of_message',
          title:             title.trim(),
          message:           message.trim(),
          relatedEntityType: 'event_broadcast',
          relatedEntityId:   broadcast._id,
        });
        notifiedCount++;
      }
    }

    return res.status(201).json({
      message:        `Broadcast sent to ${recipients.length} guest(s)`,
      broadcast,
      recipientCount: recipients.length,
      notifiedCount,
    });
  } catch (err) {
    console.error('sendBroadcast error:', err);
    return res.status(500).json({ message: 'Failed to send broadcast', error: err.message });
  }
};

export const getBroadcasts = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({ _id: eventId, organizerId: req.user.user_id }).lean();
    if (!event) return res.status(404).json({ message: 'Event not found or access denied' });

    const broadcasts = await EventBroadcast.find({ eventId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(broadcasts);
  } catch (err) {
    console.error('getBroadcasts error:', err);
    return res.status(500).json({ message: 'Failed to fetch broadcasts' });
  }
};