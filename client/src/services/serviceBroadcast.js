import { apiFetch } from '../utils/apiFetch';

export const getBroadcasts = (eventId) =>
  apiFetch(`/events/${eventId}/broadcasts`);

export const sendBroadcast = (eventId, data) =>
  apiFetch(`/events/${eventId}/broadcasts`, {
    method: 'POST',
    body:   JSON.stringify(data),
  });