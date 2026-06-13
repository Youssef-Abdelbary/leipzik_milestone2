import { apiFetch } from "../utils/apiFetch";

export async function fetchNotifications(userId) {
  return apiFetch(`/notifications/${userId}`);
}

export async function markNotificationAsRead(id) {
  return apiFetch(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}