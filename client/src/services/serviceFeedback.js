import { apiFetch } from '../utils/apiFetch';

export const getEventFeedbackSummary = (eventId) =>
  apiFetch(`/feedback/event/${eventId}/summary`);