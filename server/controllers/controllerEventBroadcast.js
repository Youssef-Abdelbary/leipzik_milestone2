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
    const { title, message, type = 'announcement', rsvpFilter = 'all' } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const event = await Event.findOne({ _id: eventId, organizerId: req.user.user_id }).lean();
    if (!event) return res.status(404).json({ message: 'Event not found or access denied' });

    // Build guest filter — KAN-278: allow targeting by RSVP status for follow-ups
    const guestFilter = { eventId };
    if (rsvpFilter !== 'all') {
      guestFilter['rsvp.status'] = rsvpFilter;
    }

    const guests = await Guest.find(guestFilter).lean();

    // Build recipient list with a unique readToken per guest
    const recipients = guests.map(g => ({
      guestId:        g._id,
      fullName:       g.fullName || '',
      email:          g.email || '',
      rsvpStatus:     g.rsvp?.status || 'pending',
      deliveryMethod: 'none',
      sentAt:         null,
      readAt:         null,
      // crypto.randomBytes gives a URL-safe unique token — same approach as RSVP tokens
      readToken:      crypto.randomBytes(24).toString('hex'),
    }));

    // Save the broadcast first so we have an _id to reference in emails
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

    // Process each guest individually
    for (let i = 0; i < guests.length; i++) {
      const guest  = guests[i];
      const recip  = broadcast.recipients[i];
      let method   = 'none';

      // Path 1: Guest has a platform account → in-app notification
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

      // Path 2: Guest has an email address → send email
      // (Can happen alongside in_app — they might have both an account and email)
      if (guest.email && emailEnabled) {
        try {
          // The read URL is a public endpoint — no auth needed, just the token
          const readUrl = `${process.env.SERVER_URL || 'http://localhost:5001'}/api/broadcasts/read/${recip.readToken}`;

          await sendBroadcastEmail({
            to:         guest.email,
            guestName:  guest.fullName || 'Guest',
            subject:    title.trim(),
            body:       message.trim(),
            readUrl,
            eventTitle: event.title,
          });

          method    = method === 'in_app' ? 'in_app' : 'email'; // prefer in_app label if both
          delivered++;

          // Record that the email was sent
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
          // Don't fail the whole broadcast if one email bounces
          console.error(`Failed email to ${guest.email}:`, emailErr.message);
        }
      } else if (method !== 'none') {
        // In-app only — still record the delivery
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

    // Update aggregate counts
    await EventBroadcast.findByIdAndUpdate(broadcast._id, {
      $set: {
        totalSent:      guests.length,
        totalDelivered: delivered,
      },
    });

    // Fetch the final state to return accurate data
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

// ─── Public read-receipt endpoint ─────────────────────────────────────────────
// Called when:
//   - Guest clicks "Mark as received" link in email
//   - Email client loads the 1×1 tracking pixel
// No authentication required — the token itself proves identity.

export const markAsRead = async (req, res) => {
  try {
    const { token } = req.params;
    const isPixel   = req.query.pixel === '1';   // true if triggered by pixel load

    // Find the broadcast that contains this recipient token
    const broadcast = await EventBroadcast.findOne({
      'recipients.readToken': token,
    });

    if (!broadcast) {
      if (isPixel) {
        // Pixel requests must always return a valid image — don't return 404
        return serveClearPixel(res);
      }
      return res.status(404).json({ message: 'Invalid read token' });
    }

    const recipient = broadcast.recipients.find(r => r.readToken === token);
    const alreadyRead = Boolean(recipient?.readAt);

    if (!alreadyRead) {
      // Mark this specific recipient as read
      await EventBroadcast.updateOne(
        { _id: broadcast._id, 'recipients.readToken': token },
        {
          $set:  { 'recipients.$.readAt': new Date() },
          $inc:  { totalRead: 1 },
        }
      );
    }

    if (isPixel) {
      // Return the 1×1 transparent GIF that email clients expect
      return serveClearPixel(res);
    }

    // For link clicks — redirect to a simple confirmation page
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/message-received`);

  } catch (err) {
    console.error('markAsRead error:', err);
    if (req.query.pixel === '1') return serveClearPixel(res);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function serveClearPixel(res) {
  // Minimal 1×1 transparent GIF — 43 bytes
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Length', pixel.length);
  res.end(pixel);
}