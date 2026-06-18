import { apiFetch } from "../utils/apiFetch";

export async function fetchStaffEvents(staffId, date) {
  const query = date ? `?date=${date}` : "";
  return apiFetch(`/staff-tasks/events/${staffId}${query}`);
}

export async function fetchStaffTasks(staffId, { status, eventId } = {}) {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (eventId) params.append("eventId", eventId);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch(`/staff-tasks/tasks/${staffId}${query}`);
}

export async function updateStaffTaskProgress(taskId, payload) {
  return apiFetch(`/staff-tasks/tasks/${taskId}/progress`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
