import { apiFetch } from '../utils/apiFetch';

export const listEvents  = ()              => apiFetch('/events');
export const createEvent = (data)          => apiFetch('/events', { method: 'POST', body: JSON.stringify(data) });
export const getEvent    = (eventId)       => apiFetch(`/events/${eventId}`);
export const updateEvent = (eventId, data) => apiFetch(`/events/${eventId}`, { method: 'PUT',    body: JSON.stringify(data) });
export const deleteEvent = (eventId)       => apiFetch(`/events/${eventId}`, { method: 'DELETE' });