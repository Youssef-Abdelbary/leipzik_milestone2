import { apiFetch } from "../utils/apiFetch";

export async function getEventVendorsForStaff(staffId, eventId) {
  return apiFetch(`/staff-dayof/staff/${staffId}/events/${eventId}/vendors`);
}

export async function markVendorArrived(staffId, eventId, vendorRequestId) {
  return apiFetch(
    `/staff-dayof/staff/${staffId}/events/${eventId}/vendors/${vendorRequestId}/arrival`,
    {
      method: "PATCH",
    }
  );
}