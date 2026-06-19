import { apiFetch, BASE_URL } from "../utils/apiFetch";

const BASE = "/venues";

// Fetch all my venues
export async function getMyVenues() {
  return apiFetch(BASE);
}

// Fetch single venue
export async function getVenueById(id) {
  return apiFetch(`${BASE}/${id}`);
}

// Create venue multipart
export async function createVenue(formData) {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  const response = await fetch(`${BASE_URL}${BASE}`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(refreshToken && { "x-refresh-token": refreshToken }),
    },
    body: formData,
  });

  const newToken = response.headers.get("x-new-token");
  if (newToken) {
    localStorage.setItem("token", newToken);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Failed to create venue");
  }

  return data;
}

// Update venue multipart
export async function updateVenue(id, formData) {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  const response = await fetch(`${BASE_URL}${BASE}/${id}`, {
    method: "PUT",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(refreshToken && { "x-refresh-token": refreshToken }),
    },
    body: formData,
  });

  const newToken = response.headers.get("x-new-token");
  if (newToken) {
    localStorage.setItem("token", newToken);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Failed to update venue");
  }

  return data;
}

// Soft delete venue
export async function deleteVenue(id) {
  return apiFetch(`${BASE}/${id}`, {
    method: "DELETE",
  });
}

// Deactivate venue
export async function deactivateVenue(id) {
  return apiFetch(`${BASE}/${id}/deactivate`, {
    method: "PATCH",
  });
}

// Optional: activate venue again
export async function activateVenue(id) {
  return apiFetch(`${BASE}/${id}/activate`, {
    method: "PATCH",
  });
}

// Book a date
export async function bookDate(venueId, date) {
  return apiFetch(`${BASE}/${venueId}/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date }),
  });
}

// Cancel a booking
export async function cancelBooking(bookingId) {
  return apiFetch(`${BASE}/bookings/${bookingId}/cancel`, {
    method: "PATCH",
  });
}

// Notifications
export async function fetchNotifications() {
  const res = await apiFetch(`${BASE}/notifications`);
  return res.notifications;
}

export async function markNotificationsRead(ids = []) {
  return apiFetch(`${BASE}/notifications/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
}