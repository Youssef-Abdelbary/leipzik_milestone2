import { apiFetch } from "../utils/apiFetch";
import { log } from "../utils/logger";

export async function getGuests(staffId, eventId) {
  if (staffId && eventId) {
    return apiFetch(`/guests/staff/${staffId}/event/${eventId}`);
  }

  if (staffId) {
    return apiFetch(`/guests/staff/${staffId}`);
  }

  return apiFetch("/guests");
}

export async function updateGuestCheckIn(guestId, newStatus, methodUsed) {
  return apiFetch(`/guests/${guestId}/checkin`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus, method: methodUsed }),
  });
}