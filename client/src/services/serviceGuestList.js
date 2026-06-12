import { apiFetch } from "../utils/apiFetch";
import { log } from "../utils/logger";

export async function getGuests() {
  log("service trying to fetch guests");
  return apiFetch("/guests");
}

export async function updateGuestCheckIn(guestId, newStatus, methodUsed) {
  log("service trying to update guest check-in");
  return apiFetch(`/guests/${guestId}/checkin`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus , method : methodUsed}),
  });
}