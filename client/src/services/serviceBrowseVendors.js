import { apiFetch } from "../utils/apiFetch.js";
import { log } from "../utils/logger.js";

export async function fetchVendors() {
  return apiFetch("/browseVendors");
}

export async function submitVendorRequest(payload) {
  return apiFetch("/browseVendors/request", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

  export async function fetchEventVendorRequests(eventId) {
  return apiFetch("/vendorRequests/search", {
    method: "POST",
    body: JSON.stringify({ eventId }),
  });
}

// 4.4 & 11.5: Send the requestId inside the payload body
export async function updateDeliveryStatus(requestId, payload) {
  return apiFetch("/vendorRequests/delivery", {
    method: "PUT",
    body: JSON.stringify({ ...payload, requestId }),
  });



}