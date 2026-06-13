import { apiFetch } from '../utils/apiFetch';

const base = (eventId) => `/events/${eventId}/guests`;

export const listGuests = (eventId, { search = '', rsvp = 'all' } = {}) => {
  const qs = new URLSearchParams();
  if (search.trim()) qs.set('search', search.trim());
  if (rsvp !== 'all') qs.set('rsvp', rsvp);
  const q = qs.toString();
  return apiFetch(q ? `${base(eventId)}?${q}` : base(eventId));
};

export const addGuest = (eventId, data) =>
  apiFetch(base(eventId), { method: 'POST', body: JSON.stringify(data) });

export const updateGuest = (eventId, guestId, data) =>
  apiFetch(`${base(eventId)}/${guestId}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteGuest = (eventId, guestId) =>
  apiFetch(`${base(eventId)}/${guestId}`, { method: 'DELETE' });

export const sendInvitation = (eventId, guestId) =>
  apiFetch(`${base(eventId)}/${guestId}/invite`, { method: 'POST' });

// Public endpoint — bypass apiFetch (no auth token needed)
export const submitRsvp = async (token, rsvpStatus) => {
  const res = await fetch(`http://localhost:5001/api/rsvp/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rsvpStatus }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'RSVP failed');
  return data;
};