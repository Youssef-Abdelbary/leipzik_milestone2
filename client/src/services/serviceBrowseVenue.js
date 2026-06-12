import { apiFetch } from "../utils/apiFetch";

const BASE = "/browseVenues";

// Search active venues
export async function searchVenues(search = "") {
  const query = search.trim();
  const params = query ? `?search=${encodeURIComponent(query)}` : "";
  const data = await apiFetch(`${BASE}${params}`);

  return data.venues ?? data;
}

// Send booking request
export async function requestVenueBooking(venueId, bookingData) {
  return apiFetch(`${BASE}/${venueId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingData),
  });
}