import { apiFetch } from '../utils/apiFetch.js';

const BASE = '/venueResponse';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capitalise(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function normaliseBooking(b) {
    return {
        ...b,
        status: capitalise(b.status),
        declineReason: b.ownerResponseMessage ?? null,
        eventDate: b.requestedDates?.[0] ?? null,
        venueName: b.venueName ?? b.venueId?.name ?? null,
    };
}

// ─── Venues ──────────────────────────────────────────────────────────────────

export async function fetchMyVenues() {
    const res = await apiFetch(`${BASE}/my-venues`);
    return res.venues;
}

export async function fetchVenueAvailability(venueId) {
    const res = await apiFetch(`${BASE}/venues/${venueId}/availability`);
    return res;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export async function fetchBookingRequests() {
    const res = await apiFetch(`${BASE}/bookings`);
    return res.bookings.map(normaliseBooking);
}

export async function fetchBookingById(bookingId) {
    const res = await apiFetch(`${BASE}/bookings/${bookingId}`);
    return normaliseBooking(res.booking);
}

export async function approveBooking(bookingId) {
    const res = await apiFetch(`${BASE}/bookings/${bookingId}/approve`, { method: 'PATCH' });
    return normaliseBooking(res.booking);
}

export async function declineBooking(bookingId, reason = '') {
    const res = await apiFetch(`${BASE}/bookings/${bookingId}/decline`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    });
    return normaliseBooking(res.booking);
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function fetchMessages(bookingId) {
    const res = await apiFetch(`${BASE}/bookings/${bookingId}/messages`);
    return res.messages;
}

export async function sendMessage(bookingId, { text, type = 'message', counterProposal = null }) {
    const res = await apiFetch(`${BASE}/bookings/${bookingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type, counterProposal }),
    });
    return res.message;
}