import { apiFetch } from "../utils/apiFetch";
import { log } from "../utils/logger";

export async function getGuests() {
  return apiFetch("/guests");
}

export async function updateGuestCheckIn(guestId, newStatus, methodUsed) {
  return apiFetch(`/guests/${guestId}/checkin`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus , method : methodUsed}),
  });
}