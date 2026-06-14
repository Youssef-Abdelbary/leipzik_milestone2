import crypto from 'crypto';
import EventBroadcast from '../models/modelEventBroadcast.js';
import Guest from '../models/modelGuest.js';
import Event from '../models/modelEvent.js';
import { createNotification } from '../utils/notificationUtil.js';
import { sendBroadcastEmail, isEmailConfigured } from '../utils/emailUtil.js';

// ─── Send a broadcast ────────────────────────────────────────────────────────

export const sendBroadcast = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      title,
      message,
      type = 'announcement',
      rsvpFilter = 'all',
      specificGuestIds,   // NEW: array of guest _id strings for targeted follow-ups
    } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const event = await Event.findOne({ _id: eventId, organizerId: req.user.user_id }).lean();
    if (!event) return res.status(404).json({ message: 'Event not found or access denied' });

    // Build guest query
    // specificGuestIds takes priority — used for targeted follow-ups to unseen recipients
    let guests;
    if (Array.isArray(specificGuestIds) && specificGuestIds.length > 0) {
      guests = await Guest.find({ eventId, _id: { $in: specificGuestIds } }).lean();
    } else {
      const guestFilter = { eventId };
      if (rsvpFilter !== 'all') {
        guestFilter['rsvp.status'] = rsvpFilter;
      }
      guests = await Guest.find(guestFilter).lean();
    }

    const recipients = guests.map(g => ({
      guestId:        g._id,
      fullName:       g.fullName || '',
      email:          g.email || '',
      rsvpStatus:     g.rsvp?.status || 'pending',
      deliveryMethod: 'none',
      sentAt:         null,
      readAt:         null,
      readToken:      crypto.randomBytes(24).toString('hex'),
    }));

    const broadcast = await EventBroadcast.create({
      eventId,
      organizerId: req.user.user_id,
      title:       title.trim(),
      message:     message.trim(),
      type,
      recipients,
      totalSent:   0,
    });

    const emailEnabled = isEmailConfigured();
    const clientUrl    = process.env.CLIENT_URL || 'http://localhost:5173';
    let delivered = 0;

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      const recip = broadcast.recipients[i];
      let method  = 'none';

      if (guest.userId) {
        try {
          await createNotification({
            userId:            guest.userId,
            type:              'day_of_message',
            title:             title.trim(),
            message:           message.trim(),
            relatedEntityType: 'event_broadcast',
            relatedEntityId:   broadcast._id,
          });
          method = 'in_app';
          delivered++;
        } catch (notifErr) {
          console.error(`Failed in-app notification for guest ${guest._id}:`, notifErr.message);
        }
      }

      if (guest.email && emailEnabled) {
        try {
          const readUrl = `${process.env.SERVER_URL || 'http://localhost:5001'}/api/broadcasts/read/${recip.readToken}`;
          await sendBroadcastEmail({
            to:         guest.email,
            guestName:  guest.fullName || 'Guest',
            subject:    title.trim(),
            body:       message.trim(),
            readUrl,
            eventTitle: event.title,
          });
          method = method === 'in_app' ? 'in_app' : 'email';
          delivered++;

          await EventBroadcast.updateOne(
            { _id: broadcast._id, 'recipients.guestId': guest._id },
            {
              $set: {
                'recipients.$.deliveryMethod': method,
                'recipients.$.sentAt':         new Date(),
              },
            }
          );
        } catch (emailErr) {
          console.error(`Failed email to ${guest.email}:`, emailErr.message);
        }
      } else if (method !== 'none') {
        await EventBroadcast.updateOne(
          { _id: broadcast._id, 'recipients.guestId': guest._id },
          {
            $set: {
              'recipients.$.deliveryMethod': method,
              'recipients.$.sentAt':         new Date(),
            },
          }
        );
      }
    }

    await EventBroadcast.findByIdAndUpdate(broadcast._id, {
      $set: {
        totalSent:      guests.length,
        totalDelivered: delivered,
      },
    });

    const finalBroadcast = await EventBroadcast.findById(broadcast._id).lean();

    return res.status(201).json({
      message:        `Broadcast sent to ${guests.length} guest(s), delivered to ${delivered}`,
      broadcast:      finalBroadcast,
      recipientCount: guests.length,
      deliveredCount: delivered,
      emailEnabled,
    });

  } catch (err) {
    console.error('sendBroadcast error:', err);
    return res.status(500).json({ message: 'Failed to send broadcast', error: err.message });
  }
};

// ─── Get all broadcasts for an event ─────────────────────────────────────────

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

// ─── Get unseen recipients for a specific broadcast ──────────────────────────
// NEW: returns guests in this broadcast who were sent the message but haven't read it.
// Used by the frontend follow-up flow to target truly unseen guests, not just an RSVP filter.

export const getUnseenRecipients = async (req, res) => {
  try {
    const { eventId, broadcastId } = req.params;

    const event = await Event.findOne({ _id: eventId, organizerId: req.user.user_id }).lean();
    if (!event) return res.status(404).json({ message: 'Event not found or access denied' });

    const broadcast = await EventBroadcast.findOne({ _id: broadcastId, eventId }).lean();
    if (!broadcast) return res.status(404).json({ message: 'Broadcast not found' });

    // "Unseen" = was sent (sentAt is set) but never read
    const unseen = (broadcast.recipients || []).filter(
      r => r.sentAt && !r.readAt
    );

    return res.json({
      broadcastId,
      broadcastTitle: broadcast.title,
      unseen,
      count: unseen.length,
    });
  } catch (err) {
    console.error('getUnseenRecipients error:', err);
    return res.status(500).json({ message: 'Failed to fetch unseen recipients' });
  }
};

// ─── Public read-receipt endpoint ─────────────────────────────────────────────

export const markAsRead = async (req, res) => {
  try {
    const { token } = req.params;
    const isPixel   = req.query.pixel === '1';

    const broadcast = await EventBroadcast.findOne({ 'recipients.readToken': token });

    if (!broadcast) {
      if (isPixel) return serveClearPixel(res);
      return res.status(404).json({ message: 'Invalid read token' });
    }

    const recipient  = broadcast.recipients.find(r => r.readToken === token);
    const alreadyRead = Boolean(recipient?.readAt);

    if (!alreadyRead) {
      await EventBroadcast.updateOne(
        { _id: broadcast._id, 'recipients.readToken': token },
        {
          $set: { 'recipients.$.readAt': new Date() },
          $inc: { totalRead: 1 },
        }
      );
    }

    if (isPixel) return serveClearPixel(res);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/message-received`);

  } catch (err) {
    console.error('markAsRead error:', err);
    if (req.query.pixel === '1') return serveClearPixel(res);
    res.status(500).json({ message: 'Server error' });
  }
};

function serveClearPixel(res) {
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Length', pixel.length);
  res.end(pixel);
}