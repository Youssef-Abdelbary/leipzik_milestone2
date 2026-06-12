import { apiFetch } from '../utils/apiFetch';

export const listEvents = () =>
  apiFetch('/events');

export const createEvent = (data) =>
  apiFetch('/events', { method: 'POST', body: JSON.stringify(data) });

export const getEvent = (eventId) =>
  apiFetch(`/events/${eventId}`);