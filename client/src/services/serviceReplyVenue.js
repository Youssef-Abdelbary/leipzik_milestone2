import { apiFetch } from "../utils/apiFetch";

// GET all booking entries for the current user, each with message threads
export async function fetchMyVenueReplies(eventId) {
    const qs = eventId ? `?eventId=${eventId}` : '';
    return apiFetch(`/reply-venue${qs}`);
}

// GET single booking thread (marks incoming messages as read)
export async function fetchBookingMessages(bookingId) {
  return apiFetch(`/reply-venue/${bookingId}`);
}

// GET venue availability — { venueId, venueName, bookedDates: [{date, bookingId, source}] }
export async function fetchVenueAvailability(venueId) {
  return apiFetch(`/reply-venue/venue/${venueId}/availability`);
}

// POST plain text message
export async function sendBookingMessage(bookingId, text) {
  return apiFetch(`/reply-venue/${bookingId}/message`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

// POST a fresh counter proposal { adjustedPrice?, alternativeDates?, note?, currency? }
export async function sendCounterProposal(bookingId, { text, counterProposal }) {
  return apiFetch(`/reply-venue/${bookingId}/counter`, {
    method: "POST",
    body: JSON.stringify({ text, counterProposal }),
  });
}

// POST match an incoming counter proposal (accept its terms as-is)
export async function matchCounterProposal(bookingId, { messageId, text } = {}) {
  return apiFetch(`/reply-venue/${bookingId}/match`, {
    method: "POST",
    body: JSON.stringify({ messageId, text }),
  });
}