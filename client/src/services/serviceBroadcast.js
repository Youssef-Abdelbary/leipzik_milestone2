import { apiFetch } from '../utils/apiFetch';

export const getBroadcasts = (eventId) =>
  apiFetch(`/events/${eventId}/broadcasts`);

export const sendBroadcast = (eventId, data) =>
  apiFetch(`/events/${eventId}/broadcasts`, {
    method: 'POST',
    body:   JSON.stringify(data),
  });

// NEW: fetch guests from a specific broadcast who were delivered but haven't read it
export const getUnseenRecipients = (eventId, broadcastId) =>
  apiFetch(`/events/${eventId}/broadcasts/${broadcastId}/unseen`);