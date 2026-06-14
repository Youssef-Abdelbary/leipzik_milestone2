import Guest from '../models/modelGuest.js';
import Event from '../models/modelEvent.js';
import { sendInvitationEmail, isEmailConfigured } from '../utils/emailUtil.js';

async function verifyAccess(userId, eventId) {
  const event = await Event.findById(eventId).lean();
  if (!event) return { err: { status: 404, message: 'Event not found' } };
  if (event.organizerId.toString() !== userId)
    return { err: { status: 403, message: 'Access denied' } };
  return { event };
}

export const listGuests = async (req, res) => {
  try {
    const { err } = await verifyAccess(req.user.user_id, req.params.eventId);
    if (err) return res.status(err.status).json({ message: err.message });

    const { search, rsvp } = req.query;
    const filter = { eventId: req.params.eventId };

    if (search?.trim()) {
      const re = new RegExp(search.trim(), 'i');
      filter.$or = [{ fullName: re }, { email: re }];
    }
    if (rsvp && rsvp !== 'all') filter['rsvp.status'] = rsvp;

    const guests = await Guest.find(filter).lean().sort({ createdAt: -1 });
    res.json(guests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch guests' });
  }
};

export const addGuest = async (req, res) => {
  try {
    const { err } = await verifyAccess(req.user.user_id, req.params.eventId);
    if (err) return res.status(err.status).json({ message: err.message });

    const { fullname, email, phone, dietaryPreferences, notes } = req.body;
    if (!fullname?.trim() || !email?.trim())
      return res.status(400).json({ message: 'Name and email are required' });

    const guest = await Guest.create({
      eventId: req.params.eventId,
      fullName: fullname,
      email,
      phone: phone || 'N/A',
      rsvp: {
        dietaryPreferences: dietaryPreferences ? [dietaryPreferences] : [],
        specialRequirements: notes || '',
      },
    });
    res.status(201).json(guest);
  } catch (err) {
    if (err.code === 11000)
      return res.status(409).json({ message: 'A guest with this email already exists' });
    console.error(err);
    res.status(500).json({ message: 'Failed to add guest' });
  }
};

export const updateGuest = async (req, res) => {
  try {
    const { err } = await verifyAccess(req.user.user_id, req.params.eventId);
    if (err) return res.status(err.status).json({ message: err.message });

    const { fullname, email, phone, dietaryPreferences, notes } = req.body;
    const guest = await Guest.findOneAndUpdate(
      { _id: req.params.guestId, eventId: req.params.eventId },
      {
        fullName: fullname,
        email,
        phone,
        'rsvp.dietaryPreferences': dietaryPreferences ? [dietaryPreferences] : [],
        'rsvp.specialRequirements': notes || '',
      },
      { new: true }
    ).lean();

    if (!guest) return res.status(404).json({ message: 'Guest not found' });
    res.json(guest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update guest' });
  }
};

export const deleteGuest = async (req, res) => {
  try {
    const { err } = await verifyAccess(req.user.user_id, req.params.eventId);
    if (err) return res.status(err.status).json({ message: err.message });

    const guest = await Guest.findOneAndDelete({
      _id: req.params.guestId,
      eventId: req.params.eventId,
    });
    if (!guest) return res.status(404).json({ message: 'Guest not found' });
    res.json({ message: 'Guest removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to remove guest' });
  }
};

export const sendInvitation = async (req, res) => {
  try {
    const { err, event } = await verifyAccess(req.user.user_id, req.params.eventId);
    if (err) return res.status(err.status).json({ message: err.message });

    const guest = await Guest.findOne({
      _id: req.params.guestId,
      eventId: req.params.eventId,
    });
    if (!guest) return res.status(404).json({ message: 'Guest not found' });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const rsvpUrl = `${clientUrl}/guest/rsvp/${guest._id}`;

    let emailSent = false;
    if (guest.email && isEmailConfigured()) {
      try {
        await sendInvitationEmail({
          to:           guest.email,
          guestName:    guest.fullName || 'Guest',
          eventTitle:   event.title,
          eventDate:    event.date,
          eventTime:    event.startTime || null,
          eventEndTime: event.endTime || null,
          venueName:    event.locationSnapshot?.venueName !== 'TBD' ? event.locationSnapshot?.venueName : null,
          dressCode:    event.dressCode || null,
          agenda:       event.agenda || [],
          rsvpUrl,
        });
        emailSent = true;
      } catch (emailErr) {
        console.error('Failed to send invitation email:', emailErr.message);
      }
    }

    await Guest.findByIdAndUpdate(guest._id, {
      invitationStatus: 'sent',
      invitationSentAt: new Date(),
    });

    res.json({
      message:    emailSent ? 'Invitation email sent' : 'RSVP link generated (email not configured)',
      rsvpUrl,
      emailSent,
      guestEmail: guest.email || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send invitation' });
  }
};

export const submitRsvp = async (req, res) => {
  try {
    const { rsvpStatus, dietaryPreferences, specialRequirements } = req.body;
    if (!['attending', 'declined'].includes(rsvpStatus))
      return res.status(400).json({ message: 'Status must be attending or declined' });

    const update = {
      'rsvp.status':      rsvpStatus,
      'rsvp.respondedAt': new Date(),
    };
    if (dietaryPreferences) update['rsvp.dietaryPreferences'] = [dietaryPreferences];
    if (specialRequirements !== undefined) update['rsvp.specialRequirements'] = specialRequirements;

    const guest = await Guest.findByIdAndUpdate(
      req.params.token,
      { $set: update },
      { new: true }
    ).lean();

    if (!guest) return res.status(404).json({ message: 'Invalid RSVP link' });
    res.json({ message: 'RSVP recorded', rsvpStatus: guest.rsvp.status, fullname: guest.fullName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};